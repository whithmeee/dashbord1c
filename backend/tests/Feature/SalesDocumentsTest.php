<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SalesDocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_can_page_and_filter_confirmed_sales_documents(): void
    {
        $company = Company::factory()->create();
        $integration = Integration::factory()->for($company)->create();
        $this->actingAs($company, 'company');

        Http::fake(function ($request) {
            $url = urldecode($request->url());
            if (str_contains($url, 'Catalog_Контрагенты')) {
                return Http::response(['value' => [['Ref_Key' => 'buyer-1', 'Description' => 'Альфа']]]);
            }
            if (str_contains($url, 'Catalog_Организации')) {
                return Http::response(['value' => [['Ref_Key' => 'org-1', 'Description' => 'Основная']]]);
            }

            return Http::response(['value' => [
                $this->document('sale-2', '2025-08-20T10:00:00', 'buyer-1', '200.20'),
                $this->document('sale-1', '2025-08-10T10:00:00', 'buyer-1', '100.10'),
                $this->document('sale-eur', '2025-08-21T10:00:00', 'buyer-1', '900', 'eur'),
            ]]);
        });

        $this->getJson('/cabinet/finance/sales/documents?'.http_build_query([
            'integration_id' => $integration->id,
            'from' => '2025-08-01',
            'to' => '2025-08-31',
            'currency_key' => 'rub',
            'customer_key' => 'buyer-1',
            'page' => 2,
            'per_page' => 1,
        ]))
            ->assertOk()
            ->assertJsonPath('items.0.id', 'sale-1')
            ->assertJsonPath('items.0.customer.name', 'Альфа')
            ->assertJsonPath('items.0.organization.name', 'Основная')
            ->assertJsonPath('items.0.amount', '100.10')
            ->assertJsonPath('pagination.page', 2)
            ->assertJsonPath('pagination.total', 2)
            ->assertJsonPath('pagination.last_page', 2);
    }

    /** @return array<string, mixed> */
    private function document(string $id, string $date, string $customer, string $amount, string $currency = 'rub'): array
    {
        return [
            'Ref_Key' => $id,
            'Date' => $date,
            'Контрагент_Key' => $customer,
            'Организация_Key' => 'org-1',
            'ВалютаДокумента_Key' => $currency,
            'СуммаДокумента' => $amount,
            'Posted' => true,
            'DeletionMark' => false,
        ];
    }
}
