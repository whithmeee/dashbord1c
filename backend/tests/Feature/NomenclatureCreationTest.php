<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeAccountingBase;
use Tests\TestCase;

class NomenclatureCreationTest extends TestCase
{
    use RefreshDatabase;

    private const KIND = '11111111-1111-1111-1111-111111111111';

    private const UNIT = '22222222-2222-2222-2222-222222222222';

    private const NAME = 'Конфеты "Ассорти"';

    private bool $itemExists = false;

    private int $documentId;

    protected function setUp(): void
    {
        parent::setUp();

        $company = Company::factory()->create();
        Integration::factory()->for($company)->create(['odata_url' => 'https://base.test/odata']);
        $this->actingAs($company, 'company');
        $this->fakeBase();
        $this->documentId = $this->uploadDocument();
    }

    private function metadata(): string
    {
        $nomenclature = '<EntityType Name="Catalog_Номенклатура"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="Description" Type="Edm.String"/>'
            .'<Property Name="НаименованиеПолное" Type="Edm.String"/><Property Name="ВидНоменклатуры_Key" Type="Edm.Guid"/>'
            .'<Property Name="ЕдиницаИзмерения_Key" Type="Edm.Guid"/><Property Name="СтавкаНДС" Type="Edm.String"/></EntityType>'
            .'<EntityType Name="Catalog_ВидыНоменклатуры"><Property Name="Ref_Key" Type="Edm.Guid"/></EntityType>'
            .'<EntityType Name="Catalog_КлассификаторЕдиницИзмерения"><Property Name="Ref_Key" Type="Edm.Guid"/></EntityType>';
        $sets = '<EntitySet Name="Catalog_ВидыНоменклатуры" EntityType="StandardODATA.Catalog_ВидыНоменклатуры"/>'
            .'<EntitySet Name="Catalog_КлассификаторЕдиницИзмерения" EntityType="StandardODATA.Catalog_КлассификаторЕдиницИзмерения"/>'
            .'</EntityContainer>';

        return str_replace(
            ['</EntityContainer>', '<EntityType Name="Document_ПоступлениеТоваровУслуг">'],
            [$sets, $nomenclature.'<EntityType Name="Document_ПоступлениеТоваровУслуг">'],
            preg_replace('#<EntityType Name="Catalog_Номенклатура">.*?</EntityType>#su', '', FakeAccountingBase::METADATA),
        );
    }

    private function fakeBase(): void
    {
        $document = array_replace(FakeAccountingBase::DOCUMENT, ['items' => [
            ['name' => self::NAME, 'quantity' => 2, 'price' => 500, 'amount' => 1000, 'unit' => 'шт.', 'vat_rate' => '20%'],
        ]]);

        Http::fake(function (Request $request) use ($document) {
            $url = urldecode($request->url());

            return match (true) {
                str_contains($url, 'deepseek') => Http::response(['choices' => [['message' => ['content' => json_encode($document, JSON_UNESCAPED_UNICODE)]]]]),
                str_contains($url, '$metadata') => Http::response($this->metadata()),
                $request->method() === 'POST' => Http::response(['Ref_Key' => 'new-item'], 201),
                str_contains($url, 'Catalog_Номенклатура?') => Http::response(['value' => $this->itemExists ? [['Ref_Key' => 'item-1', 'Description' => self::NAME]] : []]),
                str_contains($url, 'Catalog_Контрагенты?') => Http::response(['value' => [['Ref_Key' => 'supplier-1', 'Description' => 'Ромашка']]]),
                str_contains($url, 'Catalog_Организации?') => Http::response(['value' => [['Ref_Key' => 'org-1', 'Description' => 'Наш']]]),
                str_contains($url, 'Catalog_ВидыНоменклатуры?') => Http::response(['value' => [['Ref_Key' => '33333333-3333-3333-3333-333333333333', 'Description' => 'Услуги'], ['Ref_Key' => self::KIND, 'Description' => 'Товары']]]),
                str_contains($url, 'Catalog_КлассификаторЕдиницИзмерения?') => Http::response(['value' => [['Ref_Key' => '44444444-4444-4444-4444-444444444444', 'Description' => 'кг'], ['Ref_Key' => self::UNIT, 'Description' => 'шт']]]),
                default => Http::response(['value' => []]),
            };
        });
    }

    private function uploadDocument(): int
    {
        return $this->post('/api/documents', [
            'integration_id' => Integration::query()->value('id'),
            'file' => FakeAccountingBase::file(),
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('ready', false)->json('id');
    }

    public function test_options_suggest_kind_unit_and_vat_rate_for_every_missing_item(): void
    {
        $this->getJson("/api/documents/{$this->documentId}/nomenclature-options")
            ->assertOk()
            ->assertJsonCount(2, 'kinds')
            ->assertJsonCount(2, 'units')
            ->assertJsonPath('vat_rates.1', ['value' => 'НДС20', 'label' => '20%'])
            ->assertJsonPath('items.0', [
                'index' => 0,
                'name' => self::NAME,
                'kind_key' => self::KIND,
                'unit_key' => self::UNIT,
                'vat_rate' => 'НДС20',
            ]);
    }

    public function test_missing_item_is_created_in_the_base_and_linked_to_the_draft(): void
    {
        $this->postJson("/api/documents/{$this->documentId}/nomenclature", ['items' => [
            ['index' => 0, 'kind_key' => self::KIND, 'unit_key' => self::UNIT, 'vat_rate' => 'НДС20'],
        ]])->assertOk();

        Http::assertSent(fn (Request $request): bool => $request->method() === 'POST'
            && str_contains(urldecode($request->url()), 'Catalog_Номенклатура')
            && $request->data() === [
                'Description' => self::NAME,
                'НаименованиеПолное' => self::NAME,
                'ВидНоменклатуры_Key' => self::KIND,
                'ЕдиницаИзмерения_Key' => self::UNIT,
                'СтавкаНДС' => 'НДС20',
            ]);
    }

    public function test_draft_becomes_ready_once_the_created_item_is_found(): void
    {
        $this->itemExists = true;

        $this->postJson("/api/documents/{$this->documentId}/nomenclature", ['items' => [['index' => 0]]])
            ->assertOk()
            ->assertJsonPath('ready', true)
            ->assertJsonPath('data.items.0.match', 'found');
    }

    public function test_item_already_present_in_the_base_is_not_created_twice(): void
    {
        $this->itemExists = true;

        $this->postJson("/api/documents/{$this->documentId}/nomenclature", ['items' => [['index' => 0]]])->assertOk();

        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'POST'
            && str_contains(urldecode($request->url()), 'Catalog_Номенклатура'));
    }

    public function test_unknown_vat_rate_and_foreign_keys_are_rejected(): void
    {
        $this->postJson("/api/documents/{$this->documentId}/nomenclature", ['items' => [['index' => 0, 'vat_rate' => '99%']]])
            ->assertUnprocessable()->assertJsonValidationErrors('items.0.vat_rate');
        $this->postJson("/api/documents/{$this->documentId}/nomenclature", ['items' => [['index' => 0, 'kind_key' => 'x']]])
            ->assertUnprocessable()->assertJsonValidationErrors('items.0.kind_key');
    }
}
