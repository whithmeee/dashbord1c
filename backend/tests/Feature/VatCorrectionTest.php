<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeAccountingBase;
use Tests\TestCase;

class VatCorrectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $company = Company::factory()->create();
        Integration::factory()->for($company)->create(['odata_url' => 'https://base.test/odata']);
        $this->actingAs($company, 'company');
        FakeAccountingBase::fake(array_replace(FakeAccountingBase::DOCUMENT, ['total' => 1200]), [
            'Catalog_Контрагенты' => [['Ref_Key' => 'supplier-1', 'Description' => 'Ромашка']],
            'Catalog_Организации' => [['Ref_Key' => 'org-1', 'Description' => 'Наш']],
            'Catalog_Номенклатура' => [['Ref_Key' => 'item-1', 'Description' => 'Болт М8']],
        ]);
    }

    private function upload(): int
    {
        return $this->post('/api/documents', [
            'integration_id' => Integration::query()->value('id'),
            'file' => FakeAccountingBase::file(),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('ready', true)
            ->assertJsonPath('data.items.0.amount', 1200)
            ->assertJsonPath('data.items.0.price', 120)
            ->assertJsonFragment(['level' => 'warning', 'field' => 'total', 'message' => 'Суммы позиций в документе были без НДС: пересчитаны с НДС 20%. Проверьте.'])
            ->json('id');
    }

    public function test_amounts_given_without_vat_are_raised_and_flagged_on_upload(): void
    {
        $this->upload();
    }

    public function test_the_flag_disappears_once_the_person_saves_their_own_amounts(): void
    {
        $id = $this->upload();
        $data = array_replace(FakeAccountingBase::DOCUMENT, ['total' => 1200]);
        $data['items'][0]['amount'] = 1200;
        $data['items'][0]['price'] = 120;

        $this->patchJson("/api/documents/{$id}", ['data' => $data])
            ->assertOk()
            ->assertJsonPath('ready', true)
            ->assertJsonMissing(['field' => 'total']);
    }
}
