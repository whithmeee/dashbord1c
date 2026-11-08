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

    public function test_sales_report_groups_realizations_by_month_and_uses_minor_units(): void
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
            ->assertJsonPath('money.amount_scale', 2)
            ->assertJsonPath('money.currency', null)
            ->assertJsonPath('monthly.0.period', '2026-10')
            ->assertJsonPath('monthly.0.amount_minor', 30030)
            ->assertJsonPath('total_amount_minor', 35035)
            ->assertJsonPath('customers.0.name', 'Альфа')
            ->assertJsonPath('customers.0.amount_minor', 30030)
            ->assertJsonPath('customers.1.name', 'Бета')
            ->assertJsonPath('customers_total_amount_minor', 35035);
    }

    public function test_deleted_and_unposted_documents_are_not_counted(): void
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
            ->assertJsonPath('total_amount_minor', 1001);
    }

    public function test_duplicate_documents_from_pages_are_counted_once(): void
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
            ->assertJsonPath('total_amount_minor', 6060);
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
            ->assertJsonPath('total_amount_minor', 0);
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
            ->assertJsonPath('monthly', [])
            ->assertJsonPath('customers', [])
            ->assertJsonPath('total_amount_minor', 0)
            ->assertJsonPath('customers_total_amount_minor', 0);
    }
}
