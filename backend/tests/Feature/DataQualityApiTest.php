<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DataQualityApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Integration $integration;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->company = Company::factory()->create();
        $this->integration = Integration::factory()->for($this->company)->create();
        $this->fakeOneC();
    }

    public function test_owner_gets_summary_and_filtered_issues(): void
    {
        $this->actingAs($this->company, 'company');

        $this->getJson("/cabinet/data-quality/summary?integration_id={$this->integration->id}")
            ->assertOk()
            ->assertJsonPath('integration_id', $this->integration->id)
            ->assertJsonPath('totals.critical', 3)
            ->assertJsonPath('totals.warning', 3)
            ->assertJsonPath('totals.checked_objects', 7)
            ->assertJsonPath('capabilities.tax_details', true)
            ->assertJsonPath('capabilities.contracts', true)
            ->assertJsonMissingPath('password');

        $issues = $this->getJson("/cabinet/data-quality/issues?integration_id={$this->integration->id}&severity=warning")
            ->assertOk()
            ->assertJsonCount(3, 'items')
            ->assertJsonPath('items.0.severity', 'warning')
            ->assertJsonMissingPath('items.0.fields.password');

        $this->assertStringContainsString('"fields":{}', $issues->getContent());
    }

    public function test_employee_needs_data_quality_section(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['sections' => ['analytics']]);
        $this->actingAs($employee, 'employee');

        $this->getJson("/cabinet/data-quality/summary?integration_id={$this->integration->id}")
            ->assertNotFound();

        $employee->update(['sections' => ['data_quality']]);

        $this->getJson("/cabinet/data-quality/summary?integration_id={$this->integration->id}")
            ->assertOk();
    }

    public function test_foreign_and_inactive_integrations_are_rejected(): void
    {
        $foreign = Integration::factory()->create();
        $this->actingAs($this->company, 'company');

        $this->getJson("/cabinet/data-quality/summary?integration_id={$foreign->id}")
            ->assertNotFound();

        $this->integration->update(['is_active' => false]);

        $this->getJson("/cabinet/data-quality/summary?integration_id={$this->integration->id}")
            ->assertStatus(409)
            ->assertJsonPath('code', 'integration_inactive');
    }

    public function test_snapshot_cache_uses_deploy_safe_primitive_data(): void
    {
        $this->actingAs($this->company, 'company');

        $this->getJson("/cabinet/data-quality/summary?integration_id={$this->integration->id}")
            ->assertOk();

        $this->assertIsArray(Cache::get("onec:{$this->integration->id}:data-quality"));
    }

    public function test_incompatible_cached_snapshot_is_rebuilt(): void
    {
        $this->actingAs($this->company, 'company');
        $incomplete = unserialize('O:20:"RemovedSnapshotClass":0:{}');
        Cache::put("onec:{$this->integration->id}:data-quality", $incomplete, 300);

        $this->getJson("/cabinet/data-quality/summary?integration_id={$this->integration->id}")
            ->assertOk()
            ->assertJsonPath('integration_id', $this->integration->id);
    }

    private function fakeOneC(): void
    {
        $metadata = file_get_contents(base_path('tests/Fixtures/data-quality-metadata.xml'));
        Http::fake([
            '*$metadata*' => Http::response($metadata),
            '*Catalog_%D0%9A%D0%BE%D0%BD%D1%82%D1%80%D0%B0%D0%B3%D0%B5%D0%BD%D1%82%D1%8B*' => Http::response(['value' => $this->counterparties()]),
            '*Catalog_%D0%94%D0%BE%D0%B3%D0%BE%D0%B2%D0%BE%D1%80%D1%8B*' => Http::response(['value' => $this->contracts()]),
        ]);
    }

    private function counterparties(): array
    {
        return [
            $this->counterparty('c1', 'Альфа', '', '', false, false, 'ЮридическоеЛицо'),
            $this->counterparty('c2', 'Бета', '123', '7701', true, true, 'ЮридическоеЛицо'),
            $this->counterparty('c3', 'Бета Север', '123', '7701', true, true, 'ЮридическоеЛицо'),
            $this->counterparty('c4', 'Архив', '999', '999', true, true, 'ЮридическоеЛицо', true),
            $this->counterparty('c5', 'Иван', '500', '', true, true, 'ФизическоеЛицо'),
        ];
    }

    private function counterparty(string $id, string $name, string $inn, string $kpp, bool $innValid, bool $kppValid, string $type, bool $deleted = false): array
    {
        return ['Ref_Key' => $id, 'Description' => $name, 'DeletionMark' => $deleted, 'IsFolder' => false, 'ИНН' => $inn, 'КПП' => $kpp, 'ИННВведенКорректно' => $innValid, 'КППВведенКорректно' => $kppValid, 'ЮридическоеФизическоеЛицо' => $type];
    }

    private function contracts(): array
    {
        return [
            ['Ref_Key' => 'd1', 'Description' => 'Основной', 'Owner_Key' => 'c2', 'DeletionMark' => false],
            ['Ref_Key' => 'd2', 'Description' => 'Договор Ивана', 'Owner_Key' => 'c5', 'DeletionMark' => false],
        ];
    }
}
