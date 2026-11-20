<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeAccountingBase;
use Tests\TestCase;

class ItemUnitsTest extends TestCase
{
    use RefreshDatabase;

    private const PIECES = '22222222-2222-2222-2222-222222222222';

    private const LITERS = '44444444-4444-4444-4444-444444444444';

    private const NAME = 'Конфеты "Ассорти"';

    private int $documentId;

    protected function setUp(): void
    {
        parent::setUp();

        $company = Company::factory()->create();
        Integration::factory()->for($company)->create(['odata_url' => 'https://base.test/odata']);
        $this->actingAs($company, 'company');
        $this->fakeBase();
        $this->documentId = $this->post('/api/documents', [
            'integration_id' => Integration::query()->value('id'),
            'file' => FakeAccountingBase::file(),
        ], ['Accept' => 'application/json'])->assertCreated()->json('id');
    }

    private function metadata(): string
    {
        $nomenclature = '<EntityType Name="Catalog_Номенклатура"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="Description" Type="Edm.String"/>'
            .'<Property Name="ЕдиницаИзмерения_Key" Type="Edm.Guid"/></EntityType>'
            .'<EntityType Name="Catalog_КлассификаторЕдиницИзмерения"><Property Name="Ref_Key" Type="Edm.Guid"/></EntityType>';
        $sets = '<EntitySet Name="Catalog_КлассификаторЕдиницИзмерения" EntityType="StandardODATA.Catalog_КлассификаторЕдиницИзмерения"/></EntityContainer>';

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
                $request->method() === 'POST' => Http::response(['Ref_Key' => 'doc-1', 'Number' => '0000-000001'], 201),
                str_contains($url, 'Ref_Key,ЕдиницаИзмерения_Key') => Http::response(['value' => [['Ref_Key' => 'item-1', 'ЕдиницаИзмерения_Key' => self::LITERS]]]),
                str_contains($url, 'Catalog_Номенклатура?') => Http::response(['value' => [['Ref_Key' => 'item-1', 'Description' => self::NAME]]]),
                str_contains($url, 'Catalog_Контрагенты?') => Http::response(['value' => [['Ref_Key' => 'supplier-1', 'Description' => 'Ромашка']]]),
                str_contains($url, 'Catalog_Организации?') => Http::response(['value' => [['Ref_Key' => 'org-1', 'Description' => 'Наш']]]),
                str_contains($url, 'Catalog_КлассификаторЕдиницИзмерения?') => Http::response(['value' => [['Ref_Key' => self::LITERS, 'Description' => 'л'], ['Ref_Key' => self::PIECES, 'Description' => 'шт']]]),
                default => Http::response(['value' => []]),
            };
        });
    }

    public function test_item_shows_the_unit_of_its_card_and_warns_when_it_differs_from_the_document(): void
    {
        $this->getJson("/api/documents/{$this->documentId}")
            ->assertOk()
            ->assertJsonCount(2, 'data.units')
            ->assertJsonPath('data.items.0.unit', 'шт.')
            ->assertJsonPath('data.items.0.unit_key', self::LITERS)
            ->assertJsonPath('data.items.0.unit_name', 'л')
            ->assertJsonPath('data.items.0.catalog_unit_key', self::LITERS)
            ->assertJsonFragment(['field' => 'items.0.unit', 'level' => 'warning', 'message' => 'Позиция 1: в УПД единица «шт.», в 1С «л». Выберите нужную единицу в таблице или исправьте карточку номенклатуры в 1С.']);
    }

    public function test_chosen_unit_removes_the_warning_and_is_written_to_the_document_row(): void
    {
        $data = $this->getJson("/api/documents/{$this->documentId}")->json('data');
        $data['items'][0]['unit_key'] = self::PIECES;

        $this->patchJson("/api/documents/{$this->documentId}", ['data' => $data])
            ->assertOk()
            ->assertJsonPath('data.items.0.unit_key', self::PIECES)
            ->assertJsonPath('data.items.0.unit_name', 'шт')
            ->assertJsonMissing(['field' => 'items.0.unit']);

        $this->postJson("/api/documents/{$this->documentId}/write")->assertOk();

        Http::assertSent(fn (Request $request): bool => $request->method() === 'POST'
            && ($request->data()['Товары'][0]['ЕдиницаИзмерения_Key'] ?? null) === self::PIECES);
    }

    public function test_unchanged_unit_is_not_sent_to_the_document_row(): void
    {
        $this->postJson("/api/documents/{$this->documentId}/write")->assertOk();

        Http::assertSent(fn (Request $request): bool => $request->method() === 'POST'
            && ! array_key_exists('ЕдиницаИзмерения_Key', $request->data()['Товары'][0] ?? []));
    }
}
