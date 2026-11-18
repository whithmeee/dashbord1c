<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class CounterpartyTaxDetailsUpdateTest extends TestCase
{
    use RefreshDatabase;

    private const REF = '11111111-1111-1111-1111-111111111111';

    private Company $company;

    private Integration $integration;

    private bool $twinExists = false;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
        $this->integration = Integration::factory()->for($this->company)->create();
        $this->actingAs($this->company, 'company');
        $this->fakeOneC();
    }

    private function fakeOneC(): void
    {
        $metadata = file_get_contents(base_path('tests/Fixtures/data-quality-metadata.xml'));

        Http::fake(function (Request $request) use ($metadata) {
            $url = urldecode($request->url());

            return match (true) {
                str_contains($url, '$metadata') => Http::response($metadata),
                $request->method() === 'PATCH' => Http::response('', 204),
                str_contains($url, 'Ref_Key ne') => Http::response(['value' => $this->twinExists ? [['Ref_Key' => 'twin', 'Description' => 'Двойник']] : []]),
                str_contains($url, 'Ref_Key eq') => Http::response(['value' => [['Ref_Key' => self::REF, 'Description' => 'Альфа', 'ИНН' => '', 'КПП' => '770701001']]]),
                default => Http::response(['value' => []]),
            };
        });
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function fix(array $body): TestResponse
    {
        return $this->patchJson('/cabinet/data-quality/counterparties/'.self::REF, ['integration_id' => $this->integration->id] + $body);
    }

    public function test_valid_inn_is_written_into_the_counterparty_card_and_the_cached_report_is_dropped(): void
    {
        Cache::put("onec:{$this->integration->id}:data-quality", ['stale' => true], 300);

        $this->fix(['inn' => '7707083893'])->assertOk()->assertJsonPath('object_id', self::REF);

        Http::assertSent(fn (Request $request): bool => $request->method() === 'PATCH'
            && str_contains(urldecode($request->url()), "Catalog_Контрагенты(guid'".self::REF."')")
            && $request->data() === ['ИНН' => '7707083893']);
        $this->assertNull(Cache::get("onec:{$this->integration->id}:data-quality"));
    }

    public function test_kpp_and_individual_type_can_be_written(): void
    {
        $this->fix(['kpp' => '770701001'])->assertOk();
        $this->fix(['legal_type' => 'individual'])->assertOk();

        Http::assertSent(fn (Request $request): bool => $request->method() === 'PATCH' && $request->data() === ['КПП' => '770701001']);
        Http::assertSent(fn (Request $request): bool => $request->method() === 'PATCH' && $request->data() === ['ЮридическоеФизическоеЛицо' => 'ИндивидуальныйПредприниматель']);
    }

    public function test_inn_with_a_wrong_check_digit_never_reaches_1c(): void
    {
        $this->fix(['inn' => '7707083894'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('inn');
        $this->fix(['kpp' => '123'])->assertUnprocessable()->assertJsonValidationErrors('kpp');
        $this->fix([])->assertUnprocessable();

        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'PATCH');
    }

    public function test_a_card_that_would_duplicate_another_one_is_refused(): void
    {
        $this->twinExists = true;

        $this->fix(['inn' => '7707083893'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Контрагент с таким ИНН и КПП уже есть в 1С: «Двойник».');

        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'PATCH');
    }

    public function test_foreign_base_and_employee_without_the_section_are_rejected(): void
    {
        $foreign = Integration::factory()->create();

        $this->patchJson('/cabinet/data-quality/counterparties/'.self::REF, ['integration_id' => $foreign->id, 'inn' => '7707083893'])->assertNotFound();

        $employee = Employee::factory()->for($this->company)->create(['sections' => ['analytics']]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($employee, 'employee');
        $this->fix(['inn' => '7707083893'])->assertNotFound();
    }
}
