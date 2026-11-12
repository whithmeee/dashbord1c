<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\Support\FakeAccountingBase;
use Tests\TestCase;

class MonthCloseTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Integration $integration;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
        $this->integration = Integration::factory()->for($this->company)->create(['odata_url' => 'https://base.test/odata']);
        $this->actingAs($this->company, 'company');
    }

    /**
     * @param  list<array<string, mixed>>  $documents
     */
    private function fakeBase(array $documents): void
    {
        Http::fake(function (Request $request) use ($documents) {
            return str_contains($request->url(), '$metadata')
                ? Http::response(FakeAccountingBase::METADATA)
                : Http::response(['value' => $documents]);
        });
    }

    private function document(string $key, array $override = []): array
    {
        return $override + [
            'Ref_Key' => $key,
            'Number' => $key,
            'Date' => '2026-09-10T00:00:00',
            'Posted' => true,
            'Контрагент_Key' => 'supplier-1',
            'СуммаДокумента' => 1000,
        ];
    }

    private function fetch(string $path = '/api/month-close', array $extra = []): TestResponse
    {
        return $this->getJson($path.'?'.http_build_query(['integration_id' => $this->integration->id, 'month' => '2026-09'] + $extra));
    }

    public function test_summary_counts_problem_documents_and_readiness(): void
    {
        $documents = [
            $this->document('a'),
            $this->document('b', ['Posted' => false]),
            $this->document('c', ['СуммаДокумента' => 0]),
            $this->document('d', ['Контрагент_Key' => '00000000-0000-0000-0000-000000000000']),
        ];
        $this->fakeBase($documents);

        $response = $this->fetch()->assertOk()
            ->assertJsonPath('month', '2026-09')
            ->assertJsonPath('documents_total', 4)
            ->assertJsonPath('documents_flagged', 3)
            ->assertJsonPath('readiness', 25)
            ->assertJsonMissingPath('issues');

        $checks = collect($response->json('checks'))->keyBy('key');
        $this->assertSame(['critical', 1], [$checks['unposted']['status'], $checks['unposted']['count']]);
        $this->assertSame(['warning', 1], [$checks['zero_amount']['status'], $checks['zero_amount']['count']]);
        $this->assertSame(['warning', 1], [$checks['no_counterparty']['status'], $checks['no_counterparty']['count']]);
        $this->assertSame('ok', $checks['anomalous_amount']['status']);
    }

    public function test_anomalous_amount_is_flagged_against_the_usual_amount(): void
    {
        $documents = array_map(fn (int $i): array => $this->document("n{$i}"), range(1, 11));
        $documents[] = $this->document('big', ['СуммаДокумента' => 500000]);
        $this->fakeBase($documents);

        $this->fetch('/api/month-close/checks/anomalous_amount')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('items.0.ref_key', 'big')
            ->assertJsonPath('items.0.entity_label', 'Поступление товаров и услуг')
            ->assertJsonPath('items.0.date', '2026-09-10');
    }

    public function test_empty_month_is_fully_ready(): void
    {
        $this->fakeBase([]);

        $this->fetch()->assertOk()->assertJsonPath('documents_total', 0)->assertJsonPath('readiness', 100);
    }

    public function test_second_request_uses_cache_until_refresh(): void
    {
        $this->fakeBase([$this->document('a')]);

        $this->fetch()->assertOk();
        $this->fetch()->assertOk();
        Http::assertSentCount(2);

        $this->fetch('/api/month-close', ['refresh' => 1])->assertOk();
        Http::assertSentCount(3);
    }

    public function test_unknown_check_foreign_base_and_bad_month_are_rejected(): void
    {
        $this->fakeBase([]);

        $this->fetch('/api/month-close/checks/unknown')->assertNotFound();
        $this->getJson('/api/month-close?'.http_build_query(['integration_id' => Integration::factory()->create()->id, 'month' => '2026-09']))->assertNotFound();
        $this->getJson('/api/month-close?'.http_build_query(['integration_id' => $this->integration->id, 'month' => 'сентябрь']))->assertUnprocessable();
    }
}
