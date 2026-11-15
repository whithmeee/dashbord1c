<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ReceivablesTest extends TestCase
{
    use RefreshDatabase;

    private const DOCUMENT_FIELDS = '<Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="Date" Type="Edm.DateTime"/>'
        .'<Property Name="Контрагент_Key" Type="Edm.Guid"/><Property Name="СуммаДокумента" Type="Edm.Decimal"/>';

    private Integration $integration;

    protected function setUp(): void
    {
        parent::setUp();

        $company = Company::factory()->create();
        $this->integration = Integration::factory()->for($company)->create(['odata_url' => 'https://base.test/odata']);
        $this->actingAs($company, 'company');
    }

    private function metadata(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?><edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" Version="1.0">'
            .'<edmx:DataServices><Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm" Namespace="StandardODATA">'
            .'<EntityType Name="Catalog_Контрагенты"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="Description" Type="Edm.String"/></EntityType>'
            .'<EntityType Name="Document_РеализацияТоваровУслуг">'.self::DOCUMENT_FIELDS.'</EntityType>'
            .'<EntityType Name="Document_ПоступлениеНаРасчетныйСчет">'.self::DOCUMENT_FIELDS.'<Property Name="ВидОперации" Type="Edm.String"/></EntityType>'
            .'<EntityContainer Name="Container">'.$this->entitySets().'</EntityContainer>'
            .'</Schema></edmx:DataServices></edmx:Edmx>';
    }

    private function entitySets(): string
    {
        return collect(['Catalog_Контрагенты', 'Document_РеализацияТоваровУслуг', 'Document_ПоступлениеНаРасчетныйСчет'])
            ->map(fn (string $name): string => "<EntitySet Name=\"{$name}\" EntityType=\"StandardODATA.{$name}\"/>")
            ->implode('');
    }

    /**
     * @param  list<array{string, float}>  $sales
     * @param  list<array{string, float}>  $payments
     */
    private function fakeBase(array $sales, array $payments): void
    {
        $rows = fn (array $documents): array => array_map(fn (array $pair): array => [
            'Ref_Key' => 'doc-'.$pair[0],
            'Контрагент_Key' => $pair[0],
            'СуммаДокумента' => $pair[1],
        ], $documents);

        Http::fake(function (Request $request) use ($sales, $payments, $rows) {
            $url = urldecode($request->url());

            return match (true) {
                str_contains($url, '$metadata') => Http::response($this->metadata()),
                str_contains($url, 'Catalog_Контрагенты') => Http::response(['value' => [
                    ['Ref_Key' => 'unpaid-buyer', 'Description' => 'ООО Должник'],
                    ['Ref_Key' => 'partial-buyer', 'Description' => 'ООО Частично'],
                    ['Ref_Key' => 'paid-buyer', 'Description' => 'ООО Исправный'],
                    ['Ref_Key' => 'advance-buyer', 'Description' => 'ООО Аванс'],
                ]]),
                str_contains($url, 'Document_Реализация') => Http::response(['value' => $rows($sales)]),
                default => Http::response(['value' => $rows($payments)]),
            };
        });
    }

    private function fetch(string $path = '/api/receivables', array $extra = []): TestResponse
    {
        return $this->getJson($path.'?'.http_build_query(['integration_id' => $this->integration->id, 'month' => '2026-09'] + $extra));
    }

    public function test_summary_totals_and_classifies_counterparties(): void
    {
        $this->fakeBase(
            [['unpaid-buyer', 1000], ['partial-buyer', 600], ['paid-buyer', 500]],
            [['partial-buyer', 200], ['paid-buyer', 500], ['advance-buyer', 300]],
        );

        $response = $this->fetch()->assertOk()
            ->assertJsonPath('month', '2026-09')
            ->assertJsonPath('shipped', 2100)
            ->assertJsonPath('paid', 1000)
            ->assertJsonPath('outstanding', 1400)
            ->assertJsonPath('debtors_total', 2)
            ->assertJsonPath('counterparties_total', 4)
            ->assertJsonMissingPath('issues');

        $checks = collect($response->json('checks'))->keyBy('key');
        $this->assertSame(['critical', 1], [$checks['unpaid']['status'], $checks['unpaid']['count']]);
        $this->assertSame(['warning', 1], [$checks['partial']['status'], $checks['partial']['count']]);
        $this->assertSame(['warning', 1], [$checks['overpaid']['status'], $checks['overpaid']['count']]);
    }

    public function test_details_name_counterparties_and_show_what_is_owed(): void
    {
        $this->fakeBase([['partial-buyer', 600]], [['partial-buyer', 200]]);

        $this->fetch('/api/receivables/checks/partial')->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('items.0.counterparty', 'ООО Частично')
            ->assertJsonPath('items.0.shipped', 600)
            ->assertJsonPath('items.0.paid', 200)
            ->assertJsonPath('items.0.outstanding', 400);
    }

    public function test_month_without_documents_has_no_debt(): void
    {
        $this->fakeBase([], []);

        $this->fetch()->assertOk()
            ->assertJsonPath('shipped', 0)
            ->assertJsonPath('outstanding', 0)
            ->assertJsonPath('debtors_total', 0);
    }

    public function test_unknown_check_is_not_found(): void
    {
        $this->fakeBase([], []);

        $this->fetch('/api/receivables/checks/nope')->assertNotFound();
    }

    public function test_foreign_integration_is_not_available(): void
    {
        $this->fakeBase([], []);
        $foreign = Integration::factory()->create();

        $this->getJson('/api/receivables?'.http_build_query(['integration_id' => $foreign->id, 'month' => '2026-09']))->assertNotFound();
    }
}
