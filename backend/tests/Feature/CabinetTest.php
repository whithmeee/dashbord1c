<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\CompanyMessenger;
use App\Models\CompanyPhone;
use App\Models\Employee;
use App\Models\Integration;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CabinetTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
    }

    public function test_company_dashboard_shows_status_integrations_and_team(): void
    {
        Integration::factory()->for($this->company)->create();
        Integration::factory()->for($this->company)->create(['is_active' => false]);
        Employee::factory()->for($this->company)->online()->create();
        Employee::factory()->for($this->company)->create();
        Employee::factory()->create();
        CompanyPhone::factory()->for($this->company)->create();
        CompanyMessenger::factory()->for($this->company)->create();
        $this->actingAs($this->company, 'company');

        $this->getJson('/cabinet/dashboard')
            ->assertOk()
            ->assertJsonPath('company.id', $this->company->id)
            ->assertJsonPath('company.subscription_status', 'active')
            ->assertJsonMissingPath('company.subscription_ends_at')
            ->assertJsonCount(1, 'company.phones')
            ->assertJsonCount(1, 'company.messengers')
            ->assertJsonPath('integrations.count', 2)
            ->assertJsonPath('integrations.active_count', 1)
            ->assertJsonMissingPath('integrations.items.0.password')
            ->assertJsonPath('employees.count', 2)
            ->assertJsonPath('employees.online_count', 1)
            ->assertJsonMissingPath('employees.items.0.password');
    }

    public function test_dashboard_stays_available_with_an_inactive_subscription(): void
    {
        $this->actingAs(Company::factory()->expired()->create(), 'company');

        $this->getJson('/cabinet/dashboard')
            ->assertOk()
            ->assertJsonPath('company.subscription_status', 'inactive');
    }

    public function test_employee_dashboard_has_no_team_block(): void
    {
        Integration::factory()->for($this->company)->create();
        $employee = Employee::factory()->for($this->company)->create();
        $this->actingAs($employee, 'employee');

        $this->getJson('/cabinet/dashboard')
            ->assertOk()
            ->assertJsonPath('integrations.count', 1)
            ->assertJsonMissingPath('employees');
        $this->getJson('/cabinet/integrations')->assertOk()->assertJsonCount(1);
    }

    public function test_company_updates_name_and_replaces_contacts(): void
    {
        CompanyPhone::factory()->count(2)->for($this->company)->create();
        $this->actingAs($this->company, 'company');

        $this->patchJson('/cabinet/settings', [
            'name' => 'Новое название',
            'phones' => [['phone' => '+79990000001', 'label' => 'Основной']],
            'messengers' => [['name' => 'Telegram', 'contact' => '@new']],
        ])->assertOk()
            ->assertJsonPath('name', 'Новое название')
            ->assertJsonCount(1, 'phones')
            ->assertJsonPath('messengers.0.contact', '@new');

        $this->getJson('/cabinet/settings')->assertOk()->assertJsonCount(1, 'phones');
        $this->assertDatabaseCount('company_phones', 1);
    }

    public function test_settings_without_contact_lists_keep_existing_contacts(): void
    {
        CompanyPhone::factory()->for($this->company)->create();
        $this->actingAs($this->company, 'company');

        $this->patchJson('/cabinet/settings', ['name' => 'Только имя'])->assertOk()->assertJsonCount(1, 'phones');
    }

    public function test_company_cannot_change_its_subscription_or_email(): void
    {
        $this->actingAs($this->company, 'company');

        $this->patchJson('/cabinet/settings', [
            'email' => 'hacker@example.com',
            'subscription_ends_at' => '2099-01-01',
        ])->assertOk();

        $fresh = $this->company->fresh();
        $this->assertSame($this->company->email, $fresh->email);
        $this->assertSame($this->company->subscription_ends_at->toDateString(), $fresh->subscription_ends_at->toDateString());
    }

    public function test_company_manages_its_employees(): void
    {
        $this->actingAs($this->company, 'company');

        $created = $this->postJson('/cabinet/employees', [
            'name' => 'Иван Петров',
            'position' => 'Бухгалтер',
            'login' => 'ivan_petrov',
            'password' => 'secret-pass1',
        ])->assertCreated()
            ->assertJsonPath('position', 'Бухгалтер')
            ->assertJsonPath('is_online', false)
            ->assertJsonMissingPath('password');

        $id = $created->json('id');
        $this->assertTrue(password_verify('secret-pass1', Employee::findOrFail($id)->password));
        $this->getJson('/cabinet/employees')->assertOk()->assertJsonCount(1);

        $this->patchJson("/cabinet/employees/{$id}", ['position' => 'Главбух', 'password' => 'new-secret-2'])
            ->assertOk()
            ->assertJsonPath('position', 'Главбух');
        $this->assertTrue(password_verify('new-secret-2', Employee::findOrFail($id)->password));

        $this->deleteJson("/cabinet/employees/{$id}")->assertNoContent();
        $this->assertDatabaseCount('employees', 0);
    }

    public function test_created_employee_can_log_in(): void
    {
        $this->actingAs($this->company, 'company');
        $this->postJson('/cabinet/employees', [
            'name' => 'Иван', 'position' => 'Менеджер', 'login' => 'ivan', 'password' => 'secret-pass1',
        ])->assertCreated();

        $this->app['auth']->forgetGuards();
        $this->postJson('/auth/login', ['login' => 'ivan', 'password' => 'secret-pass1'])
            ->assertOk()
            ->assertJsonPath('type', 'employee');
    }

    public function test_employee_login_rules(): void
    {
        $this->actingAs($this->company, 'company');
        Employee::factory()->for($this->company)->create(['login' => 'taken']);
        $valid = ['name' => 'Иван', 'position' => 'Менеджер', 'password' => 'secret-pass1'];

        $this->postJson('/cabinet/employees', $valid + ['login' => 'taken'])->assertUnprocessable()->assertJsonValidationErrors('login');
        $this->postJson('/cabinet/employees', $valid + ['login' => 'ivan@mail.ru'])->assertUnprocessable()->assertJsonValidationErrors('login');
        $this->postJson('/cabinet/employees', $valid + ['login' => 'иван'])->assertUnprocessable()->assertJsonValidationErrors('login');
        $this->postJson('/cabinet/employees', array_merge($valid, ['login' => 'new_one', 'password' => 'weak']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_company_cannot_touch_another_companys_employee(): void
    {
        $foreign = Employee::factory()->create();
        $this->actingAs($this->company, 'company');

        $this->patchJson("/cabinet/employees/{$foreign->id}", ['name' => 'X'])->assertNotFound();
        $this->deleteJson("/cabinet/employees/{$foreign->id}")->assertNotFound();
        $this->assertDatabaseHas('employees', ['id' => $foreign->id]);
    }

    public function test_employee_cannot_manage_team_or_settings(): void
    {
        $this->actingAs(Employee::factory()->for($this->company)->create(), 'employee');

        $this->getJson('/cabinet/employees')->assertForbidden();
        $this->postJson('/cabinet/employees', [])->assertForbidden();
        $this->getJson('/cabinet/settings')->assertForbidden();
        $this->patchJson('/cabinet/settings', ['name' => 'X'])->assertForbidden();
    }

    public function test_staff_users_have_no_client_cabinet(): void
    {
        $this->seed(RoleSeeder::class);
        $this->actingAs(User::factory()->create());

        $this->getJson('/cabinet/dashboard')->assertUnauthorized();
    }
}
