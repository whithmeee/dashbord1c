<?php

namespace Tests\Feature;

use App\Enums\CabinetSection;
use App\Models\Company;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeSectionsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
    }

    public function test_owner_picks_sections_when_creating_an_employee(): void
    {
        $this->actingAs($this->company, 'company');

        $this->postJson('/cabinet/employees', $this->payload(['sections' => ['chat', 'analytics']]))
            ->assertCreated()
            ->assertJsonPath('sections', ['chat', 'analytics']);
    }

    public function test_employee_gets_every_section_when_none_are_chosen(): void
    {
        $this->actingAs($this->company, 'company');

        $this->postJson('/cabinet/employees', $this->payload())
            ->assertCreated()
            ->assertJsonPath('sections', CabinetSection::values());
    }

    public function test_owner_can_not_grant_an_unknown_section(): void
    {
        $this->actingAs($this->company, 'company');

        $this->postJson('/cabinet/employees', $this->payload(['sections' => ['admin-panel']]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sections.0');
    }

    public function test_owner_changes_sections_of_an_employee(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $this->actingAs($this->company, 'company');

        $this->patchJson("/cabinet/employees/{$employee->id}", ['sections' => ['finance']])
            ->assertOk()
            ->assertJsonPath('sections', ['finance']);
    }

    public function test_employee_gets_not_found_for_sections_without_access(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['sections' => ['analytics']]);
        $this->actingAs($employee, 'employee');

        $this->getJson('/cabinet/statistics')->assertOk();
        $this->getJson('/cabinet/dashboard')->assertOk();
        $this->getJson('/cabinet/integrations')->assertNotFound();
        $this->getJson('/cabinet/subscription')->assertNotFound();
        $this->getJson('/cabinet/system-status')->assertNotFound();
        $this->getJson('/cabinet/finance/sales')->assertNotFound();
        $this->getJson('/api/chats')->assertNotFound();
    }

    public function test_dashboard_hides_blocks_of_closed_sections(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['sections' => ['chat']]);
        $this->actingAs($employee, 'employee');

        $this->getJson('/cabinet/dashboard')
            ->assertOk()
            ->assertJsonMissingPath('integrations')
            ->assertJsonMissingPath('company.subscription_status')
            ->assertJsonMissingPath('employees');
    }

    public function test_dashboard_shows_blocks_of_open_sections(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['sections' => ['integrations', 'subscription']]);
        $this->actingAs($employee, 'employee');

        $this->getJson('/cabinet/dashboard')
            ->assertOk()
            ->assertJsonPath('integrations.count', 0)
            ->assertJsonPath('company.subscription_status', 'active');
    }

    public function test_employee_without_sections_gets_not_found_everywhere(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['sections' => []]);
        $this->actingAs($employee, 'employee');

        foreach (['/cabinet/finance/sales', '/cabinet/integrations', '/cabinet/statistics', '/cabinet/subscription', '/cabinet/system-status', '/api/chats'] as $path) {
            $this->getJson($path)->assertNotFound();
        }
    }

    public function test_revoked_section_is_closed_at_once(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $this->actingAs($employee, 'employee');
        $this->getJson('/cabinet/subscription')->assertOk();

        $employee->update(['sections' => ['chat']]);

        $this->getJson('/cabinet/subscription')->assertNotFound();
    }

    public function test_employee_with_chat_section_reaches_the_chat(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['sections' => ['chat']]);
        $this->actingAs($employee, 'employee');

        $this->getJson('/api/chats')->assertOk();
    }

    public function test_company_is_never_limited_by_sections(): void
    {
        $this->actingAs($this->company, 'company');

        $this->getJson('/cabinet/integrations')->assertOk();
        $this->getJson('/cabinet/subscription')->assertOk();
    }

    public function test_employee_sees_own_sections_in_profile(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['sections' => ['chat']]);
        $this->actingAs($employee, 'employee');

        $this->getJson('/auth/me')->assertOk()->assertJsonPath('account.sections', ['chat']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Иван',
            'position' => 'Менеджер',
            'login' => 'ivan',
            'password' => 'secret-pass1',
        ], $overrides);
    }
}
