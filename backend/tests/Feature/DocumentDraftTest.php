<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\DocumentDraft;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\Support\FakeAccountingBase;
use Tests\TestCase;

class DocumentDraftTest extends TestCase
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
     * @return array<string, list<array<string, string>>>
     */
    private function fullCatalogs(): array
    {
        return [
            'Catalog_Контрагенты' => [['Ref_Key' => 'supplier-1', 'Description' => 'Ромашка']],
            'Catalog_Организации' => [['Ref_Key' => 'org-1', 'Description' => 'Наш']],
            'Catalog_Номенклатура' => [['Ref_Key' => 'item-1', 'Description' => 'Болт М8']],
        ];
    }

    private function upload(): TestResponse
    {
        return $this->post('/api/documents', [
            'integration_id' => $this->integration->id,
            'file' => FakeAccountingBase::file(),
        ], ['Accept' => 'application/json']);
    }

    public function test_upload_builds_a_draft_linked_to_records_of_the_base(): void
    {
        FakeAccountingBase::fake(FakeAccountingBase::DOCUMENT, $this->fullCatalogs());

        $this->upload()
            ->assertCreated()
            ->assertJsonPath('status', 'draft')
            ->assertJsonPath('ready', true)
            ->assertJsonPath('data.counterparty.ref_key', 'supplier-1')
            ->assertJsonPath('data.buyer.ref_key', 'org-1')
            ->assertJsonPath('data.items.0.ref_key', 'item-1')
            ->assertJsonPath('data.total', 1000);
    }

    public function test_unknown_counterparty_and_wrong_sum_are_reported_and_block_writing(): void
    {
        $document = array_replace(FakeAccountingBase::DOCUMENT, ['total' => 999]);
        FakeAccountingBase::fake($document, ['Catalog_Организации' => $this->fullCatalogs()['Catalog_Организации']]);

        $id = $this->upload()
            ->assertCreated()
            ->assertJsonPath('ready', false)
            ->json('id');

        $fields = collect(DocumentDraft::findOrFail($id)->issues)->where('level', 'error')->pluck('field')->all();
        $this->assertEqualsCanonicalizing(['counterparty', 'items.0', 'total'], $fields);

        $this->postJson("/api/documents/{$id}/write")->assertUnprocessable();
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'POST' && str_contains($request->url(), 'Document_'));
    }

    public function test_corrected_draft_is_written_once_as_an_unposted_document(): void
    {
        FakeAccountingBase::fake(FakeAccountingBase::DOCUMENT, $this->fullCatalogs());
        $id = $this->upload()->json('id');

        $this->postJson("/api/documents/{$id}/write")
            ->assertOk()
            ->assertJsonPath('status', 'written')
            ->assertJsonPath('onec_number', '000123');

        Http::assertSent(function (Request $request): bool {
            return $request->method() === 'POST'
                && str_contains(urldecode($request->url()), 'Document_ПоступлениеТоваровУслуг')
                && $request['Posted'] === false
                && $request['Контрагент_Key'] === 'supplier-1'
                && $request['Товары'][0]['Номенклатура_Key'] === 'item-1';
        });
        $this->postJson("/api/documents/{$id}/write")->assertUnprocessable();
    }

    public function test_edited_draft_is_checked_again(): void
    {
        FakeAccountingBase::fake(FakeAccountingBase::DOCUMENT, $this->fullCatalogs());
        $id = $this->upload()->json('id');

        $this->patchJson("/api/documents/{$id}", ['data' => ['number' => '']])
            ->assertOk()
            ->assertJsonPath('ready', false);
    }

    public function test_base_with_unsupported_configuration_is_rejected(): void
    {
        FakeAccountingBase::fake(FakeAccountingBase::DOCUMENT, [], '<edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx"><edmx:DataServices><Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm"><EntityType Name="Catalog_Другое"><Property Name="Ref_Key" Type="Edm.Guid"/></EntityType><EntityContainer Name="C"><EntitySet Name="Catalog_Другое" EntityType="X.Catalog_Другое"/></EntityContainer></Schema></edmx:DataServices></edmx:Edmx>');

        $this->upload()->assertUnprocessable();
    }

    public function test_foreign_draft_is_not_accessible(): void
    {
        $foreign = DocumentDraft::factory()->create();

        $this->getJson("/api/documents/{$foreign->id}")->assertForbidden();
        $this->postJson("/api/documents/{$foreign->id}/write")->assertForbidden();
    }

    public function test_only_own_active_base_accepts_uploads(): void
    {
        $this->post('/api/documents', [
            'integration_id' => Integration::factory()->create()->id,
            'file' => FakeAccountingBase::file(),
        ], ['Accept' => 'application/json'])->assertUnprocessable();
    }
}
