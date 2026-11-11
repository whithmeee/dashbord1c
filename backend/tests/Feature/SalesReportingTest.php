<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SalesReportingTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Integration $integration;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
        $this->integration = Integration::factory()->for($this->company)->create();
        $this->actingAs($this->company, 'company');
    }

    public function test_real_analytics_defaults_to_latest_six_months_and_never_mixes_currencies(): void
    {
        Http::fake(function ($request) {
            $url = urldecode($request->url());

            if (str_contains($url, 'Catalog_Валюты')) {
                return Http::response(['value' => [
                    ['Ref_Key' => 'rub', 'Description' => 'руб.'],
                    ['Ref_Key' => 'eur', 'Description' => 'EUR'],
                ]]);
            }
            if (str_contains($url, 'Catalog_Контрагенты')) {
                return Http::response(['value' => [
                    ['Ref_Key' => 'buyer-1', 'Description' => 'Альфа'],
                    ['Ref_Key' => 'buyer-2', 'Description' => 'Бета'],
                ]]);
            }
            if (str_contains($url, 'Catalog_Организации')) {
                return Http::response(['value' => [
                    ['Ref_Key' => 'org-1', 'Description' => 'Основная организация'],
                ]]);
            }
            if (str_contains($url, 'Document_ПоступлениеНаРасчетныйСчет')) {
                return Http::response(['value' => [
                    $this->moneyDocument('receipt-1', '2025-08-10T10:00:00', 'rub', 75.25),
                    $this->moneyDocument('receipt-eur', '2025-08-10T10:00:00', 'eur', 999),
                ]]);
            }
            if (str_contains($url, 'Document_СписаниеСРасчетногоСчета')) {
                return Http::response(['value' => [
                    $this->moneyDocument('payment-1', '2025-08-11T10:00:00', 'rub', 25.05),
                ]]);
            }
            if (str_contains($url, 'Document_РеализацияТоваровУслуг')) {
                return Http::response(['value' => [
                    $this->salesDocument('sale-2', '2025-08-20T10:00:00', 'rub', 'buyer-2', 200.205),
                    $this->salesDocument('sale-1', '2025-03-10T10:00:00', 'rub', 'buyer-1', 100.105),
                    $this->salesDocument('sale-eur', '2025-08-21T10:00:00', 'eur', 'buyer-1', 900),
                ]]);
            }

            return Http::response(['value' => []]);
        });

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id)
            ->assertOk()
            ->assertJsonPath('period.from', '2025-03-01')
            ->assertJsonPath('period.to', '2025-08-31')
            ->assertJsonPath('financial_status', 'available')
            ->assertJsonPath('money.currency_key', 'rub')
            ->assertJsonPath('money.currency', 'руб.')
            ->assertJsonPath('money.unit', 'odata_document_amount')
            ->assertJsonPath('total_amount', '300.310')
            ->assertJsonPath('metrics.sales_documents', 2)
            ->assertJsonPath('metrics.customers', 2)
            ->assertJsonPath('metrics.organizations', 1)
            ->assertJsonPath('monthly.0.period', '2025-03')
            ->assertJsonPath('monthly.0.amount', '100.105')
            ->assertJsonPath('monthly.5.period', '2025-08')
            ->assertJsonPath('monthly.5.amount', '200.205')
            ->assertJsonPath('receipts.5.amount', '75.25')
            ->assertJsonPath('payments.5.amount', '25.05')
            ->assertJsonCount(2, 'currencies');

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&months=6&currency_key=eur')
            ->assertOk()
            ->assertJsonPath('money.currency', 'EUR')
            ->assertJsonPath('metrics.sales_documents', 1)
            ->assertJsonPath('total_amount', '900.00')
            ->assertJsonPath('receipts.5.amount', '999.00')
            ->assertJsonPath('payments.5.amount', '0.00');
    }

    /** @return array<string, mixed> */
    private function salesDocument(string $key, string $date, string $currency, string $customer, float $amount): array
    {
        return $this->moneyDocument($key, $date, $currency, $amount) + [
            'Контрагент_Key' => $customer,
        ];
    }

    /** @return array<string, mixed> */
    private function moneyDocument(string $key, string $date, string $currency, float $amount): array
    {
        return [
            'Ref_Key' => $key,
            'Date' => $date,
            'Организация_Key' => 'org-1',
            'ВалютаДокумента_Key' => $currency,
            'СуммаДокумента' => $amount,
            'Posted' => true,
            'DeletionMark' => false,
        ];
    }

    public function test_documents_without_currency_are_not_aggregated(): void
    {
        Http::fake([
            '*Document_*' => Http::response(['value' => [
                ['Ref_Key' => 'd1', 'Date' => '2026-10-01T10:00:00', 'Контрагент_Key' => 'buyer-1', 'СуммаДокумента' => 100.10, 'Posted' => true, 'DeletionMark' => false],
                ['Ref_Key' => 'd2', 'Date' => '2026-10-31T10:00:00', 'Контрагент_Key' => 'buyer-1', 'СуммаДокумента' => 200.20, 'Posted' => true, 'DeletionMark' => false],
                ['Ref_Key' => 'd3', 'Date' => '2026-11-01T10:00:00', 'Контрагент_Key' => 'buyer-2', 'СуммаДокумента' => 50.05, 'Posted' => true, 'DeletionMark' => false],
            ]]),
            '*Catalog_*' => Http::response(['value' => [
                ['Ref_Key' => 'buyer-1', 'Description' => 'Альфа'],
                ['Ref_Key' => 'buyer-2', 'Description' => 'Бета'],
            ]]),
        ]);

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-10-01&to=2026-11-30')
            ->assertOk()
            ->assertJsonPath('integration_id', $this->integration->id)
            ->assertJsonPath('period.from', '2026-10-01')
            ->assertJsonPath('period.to', '2026-11-30')
            ->assertJsonPath('financial_status', 'empty')
            ->assertJsonPath('financial_status_code', null)
            ->assertJsonPath('money.amount_scale', null)
            ->assertJsonPath('money.unit', 'odata_document_amount')
            ->assertJsonPath('money.currency', null)
            ->assertJsonPath('monthly.0.amount', '0.00')
            ->assertJsonPath('customers', [])
            ->assertJsonPath('total_amount', '0.00');
    }

    public function test_deleted_and_unposted_documents_do_not_enter_analytics(): void
    {
        Http::fake([
            '*Document_*' => Http::response(['value' => [
                ['Ref_Key' => 'valid', 'Date' => '2026-10-01T10:00:00', 'Контрагент_Key' => 'buyer', 'СуммаДокумента' => 10.01],
                ['Ref_Key' => 'deleted', 'Date' => '2026-10-01T10:00:00', 'Контрагент_Key' => 'buyer', 'СуммаДокумента' => 20.02, 'DeletionMark' => true],
                ['Ref_Key' => 'unposted', 'Date' => '2026-10-01T10:00:00', 'Контрагент_Key' => 'buyer', 'СуммаДокумента' => 30.03, 'Posted' => false],
            ]]),
            '*Catalog_*' => Http::response(['value' => [
                ['Ref_Key' => 'buyer', 'Description' => 'Покупатель'],
            ]]),
        ]);

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->assertJsonPath('financial_status', 'empty')
            ->assertJsonPath('total_amount', '0.00');
    }

    public function test_duplicate_documents_from_pages_are_deduplicated(): void
    {
        config(['services.onec.page_size' => 2]);

        Http::fake(function ($request) {
            if (str_contains($request->url(), 'Catalog_')) {
                return Http::response(['value' => [
                    ['Ref_Key' => 'buyer', 'Description' => 'Покупатель'],
                ]]);
            }

            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            return match ((int) ($query['$skip'] ?? 0)) {
                0 => Http::response(['value' => [
                    ['Ref_Key' => 'd1', 'Date' => '2026-10-01T10:00:00', 'Контрагент_Key' => 'buyer', 'СуммаДокумента' => 10.10],
                    ['Ref_Key' => 'd2', 'Date' => '2026-10-02T10:00:00', 'Контрагент_Key' => 'buyer', 'СуммаДокумента' => 20.20],
                ]]),
                2 => Http::response(['value' => [
                    ['Ref_Key' => 'd2', 'Date' => '2026-10-02T10:00:00', 'Контрагент_Key' => 'buyer', 'СуммаДокумента' => 20.20],
                    ['Ref_Key' => 'd3', 'Date' => '2026-10-03T10:00:00', 'Контрагент_Key' => 'buyer', 'СуммаДокумента' => 30.30],
                ]]),
                default => Http::response(['value' => []]),
            };
        });

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->assertJsonPath('financial_status', 'empty')
            ->assertJsonPath('monthly.0.amount', '0.00')
            ->assertJsonPath('total_amount', '0.00');
    }

    public function test_exhausted_one_c_pagination_returns_an_explicit_error(): void
    {
        config(['services.onec.page_size' => 1]);
        Http::fake(function ($request) {
            if (! str_contains($request->url(), 'Document_')) {
                return Http::response(['value' => []]);
            }

            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            return Http::response(['value' => [[
                'Ref_Key' => 'd'.((int) ($query['$skip'] ?? 0)),
                'Date' => '2026-10-01T10:00:00',
                'СуммаДокумента' => 1,
            ]]]);
        });

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-10-01&to=2026-10-31')
            ->assertStatus(502)
            ->assertJsonPath('code', 'onec_unavailable');
    }

    public function test_foreign_and_inactive_integrations_are_rejected(): void
    {
        $foreign = Integration::factory()->create();
        $inactive = Integration::factory()->for($this->company)->create(['is_active' => false]);

        $this->getJson('/cabinet/finance/sales?integration_id='.$foreign->id.'&from=2026-10-01&to=2026-10-31')
            ->assertNotFound();
        $this->getJson('/cabinet/finance/sales?integration_id='.$inactive->id.'&from=2026-10-01&to=2026-10-31')
            ->assertStatus(409)
            ->assertJsonPath('code', 'integration_inactive');
    }

    public function test_employee_can_read_their_company_sales_report(): void
    {
        Http::fake([
            '*Document_*' => Http::response(['value' => []]),
            '*Catalog_*' => Http::response(['value' => []]),
        ]);
        $this->app['auth']->forgetGuards();
        $this->actingAs(Employee::factory()->for($this->company)->create(), 'employee');

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->assertJsonPath('financial_status', 'empty')
            ->assertJsonPath('total_amount', '0.00');
    }

    public function test_invalid_period_and_one_c_failure_are_reported(): void
    {
        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-11-01&to=2026-10-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');

        Http::fake(['*Document_*' => Http::response('unavailable', 503)]);

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-10-01&to=2026-10-31')
            ->assertStatus(502)
            ->assertJsonPath('code', 'onec_unavailable');
    }

    public function test_empty_period_is_a_successful_zero_report(): void
    {
        Http::fake([
            '*Document_*' => Http::response(['value' => []]),
            '*Catalog_*' => Http::response(['value' => []]),
        ]);

        $this->getJson('/cabinet/finance/sales?integration_id='.$this->integration->id.'&from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->assertJsonPath('financial_status', 'empty')
            ->assertJsonPath('monthly.0.amount', '0.00')
            ->assertJsonPath('customers', [])
            ->assertJsonPath('total_amount', '0.00');
    }
}
