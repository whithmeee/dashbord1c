<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeAccountingBase;
use Tests\TestCase;

class CounterpartyCreationTest extends TestCase
{
    use RefreshDatabase;

    private bool $supplierExists = false;

    private int $documentId;

    protected function setUp(): void
    {
        parent::setUp();

        $company = Company::factory()->create();
        Integration::factory()->for($company)->create(['odata_url' => 'https://base.test/odata']);
        $this->actingAs($company, 'company');
    }

    private function metadata(): string
    {
        return str_replace(
            '<EntityType Name="Catalog_Контрагенты"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="ИНН" Type="Edm.String"/>',
            '<EntityType Name="Catalog_Контрагенты"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="ИНН" Type="Edm.String"/>'
            .'<Property Name="КПП" Type="Edm.String"/><Property Name="НаименованиеПолное" Type="Edm.String"/><Property Name="ЮрФизЛицо" Type="Edm.String"/>',
            FakeAccountingBase::METADATA,
        );
    }

    private function fakeBase(array $document): void
    {
        Http::fake(function (Request $request) use ($document) {
            $url = urldecode($request->url());

            return match (true) {
                str_contains($url, 'deepseek') => Http::response(['choices' => [['message' => ['content' => json_encode($document, JSON_UNESCAPED_UNICODE)]]]]),
                str_contains($url, '$metadata') => Http::response($this->metadata()),
                $request->method() === 'POST' => Http::response(['Ref_Key' => 'new-supplier'], 201),
                str_contains($url, 'Catalog_Контрагенты?') => Http::response(['value' => $this->supplierExists ? [['Ref_Key' => 'supplier-1', 'Description' => 'Ромашка']] : []]),
                str_contains($url, 'Catalog_Организации?') => Http::response(['value' => [['Ref_Key' => 'org-1', 'Description' => 'Наш']]]),
                str_contains($url, 'Catalog_Номенклатура?') => Http::response(['value' => [['Ref_Key' => 'item-1', 'Description' => 'Болт М8']]]),
                default => Http::response(['value' => []]),
            };
        });
    }

    private function upload(array $document = FakeAccountingBase::DOCUMENT): void
    {
        $this->fakeBase($document);
        $this->documentId = $this->post('/api/documents', [
            'integration_id' => Integration::query()->value('id'),
            'file' => FakeAccountingBase::file(),
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.counterparty.match', 'missing')->json('id');
    }

    public function test_missing_supplier_is_created_from_the_document_data(): void
    {
        $this->upload();

        $this->postJson("/api/documents/{$this->documentId}/counterparty")->assertOk();

        Http::assertSent(fn (Request $request): bool => $request->method() === 'POST'
            && str_contains(urldecode($request->url()), 'Catalog_Контрагенты')
            && $request->data() === [
                'Description' => 'ООО Ромашка',
                'НаименованиеПолное' => 'ООО Ромашка',
                'ИНН' => '7701234567',
                'ЮрФизЛицо' => 'ЮридическоеЛицо',
            ]);
    }

    public function test_draft_becomes_ready_once_the_supplier_is_in_the_base(): void
    {
        $this->upload();
        $this->supplierExists = true;

        $this->postJson("/api/documents/{$this->documentId}/counterparty")
            ->assertOk()
            ->assertJsonPath('ready', true)
            ->assertJsonPath('data.counterparty.match', 'found');
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'POST'
            && str_contains(urldecode($request->url()), 'Catalog_Контрагенты'));
    }

    public function test_supplier_without_a_valid_inn_is_not_created(): void
    {
        $this->upload(array_replace(FakeAccountingBase::DOCUMENT, [
            'counterparty' => ['name' => 'ООО Ромашка', 'inn' => '123', 'kpp' => ''],
        ]));

        $this->postJson("/api/documents/{$this->documentId}/counterparty")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Чтобы создать контрагента, нужны название и ИНН из 10 или 12 цифр.');
    }
}
