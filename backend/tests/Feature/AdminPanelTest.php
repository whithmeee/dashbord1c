<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\AdminSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function actAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        return $admin;
    }

    /**
     * @return array<string, mixed>
     */
    private function companyPayload(array $overrides = []): array
    {
        return $overrides + [
            'name' => 'ООО Ромашка',
            'email' => 'director@romashka.test',
            'subscription_starts_at' => '2026-11-01',
            'subscription_ends_at' => '2027-10-31',
            'phones' => [
                ['phone' => '+79001112233', 'label' => 'Директор'],
                ['phone' => '+79004445566'],
            ],
            'messengers' => [
                ['name' => 'Telegram', 'contact' => '@romashka'],
                ['name' => 'WhatsApp', 'contact' => '+79001112233'],
            ],
        ];
    }

    public function test_roles_are_seeded_with_fixed_ids(): void
    {
        $this->assertSame('admin', Role::findOrFail(1)->name);
        $this->assertSame('user', Role::findOrFail(2)->name);
    }

    public function test_admin_panel_is_hidden_from_everyone_but_administrators(): void
    {
        $this->getJson('/admin-panel/companies')->assertNotFound();

        $this->actingAs(User::factory()->create());
        $this->getJson('/admin-panel/companies')->assertNotFound();

        $this->actingAs(Company::factory()->create(), 'company');
        $this->getJson('/admin-panel/companies')->assertNotFound();
        $this->postJson('/admin-panel/companies', [])->assertNotFound();

        $this->actingAs(Employee::factory()->create(), 'employee');
        $this->getJson('/admin-panel/users')->assertNotFound();
        $this->getJson('/admin-panel/integrations')->assertNotFound();
    }

    public function test_admin_registers_a_company_with_contacts_and_subscription(): void
    {
        $this->actAsAdmin();

        $response = $this->postJson('/admin-panel/companies', $this->companyPayload())
            ->assertCreated()
            ->assertJsonPath('name', 'ООО Ромашка')
            ->assertJsonPath('email_verified', false)
            ->assertJsonPath('subscription_status', 'active')
            ->assertJsonPath('subscription_starts_at', '2026-11-01')
            ->assertJsonPath('subscription_ends_at', '2027-10-31')
            ->assertJsonCount(2, 'phones')
            ->assertJsonPath('phones.0.phone', '+79001112233')
            ->assertJsonPath('messengers.1.name', 'WhatsApp')
            ->assertJsonMissingPath('password');

        $company = Company::findOrFail($response->json('id'));
        $initialPassword = $response->json('initial_password');

        $this->assertNotEmpty($initialPassword);
        $this->assertNotSame($initialPassword, $company->password);
        $this->assertTrue(password_verify($initialPassword, $company->password));
        $this->assertCount(2, $company->phones);
        $this->assertCount(2, $company->messengers);
    }

    public function test_company_can_log_in_with_the_issued_password(): void
    {
        $this->actAsAdmin();
        $password = $this->postJson('/admin-panel/companies', $this->companyPayload())->json('initial_password');

        $this->app['auth']->forgetGuards();
        $this->postJson('/auth/login', ['login' => 'director@romashka.test', 'password' => $password])
            ->assertOk()
            ->assertJsonPath('type', 'company');
    }

    public function test_company_validation(): void
    {
        $admin = $this->actAsAdmin();
        Company::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/admin-panel/companies', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'subscription_starts_at', 'subscription_ends_at']);

        $this->postJson('/admin-panel/companies', $this->companyPayload(['email' => 'taken@example.com']))
            ->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/admin-panel/companies', $this->companyPayload(['email' => $admin->email]))
            ->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/admin-panel/companies', $this->companyPayload([
            'subscription_starts_at' => '2027-01-01',
            'subscription_ends_at' => '2026-01-01',
        ]))->assertUnprocessable()->assertJsonValidationErrors('subscription_ends_at');

        $this->postJson('/admin-panel/companies', $this->companyPayload(['phones' => [['label' => 'нет номера']]]))
            ->assertUnprocessable()->assertJsonValidationErrors('phones.0.phone');
    }

    public function test_future_subscription_is_inactive(): void
    {
        $this->actAsAdmin();

        $this->postJson('/admin-panel/companies', $this->companyPayload([
            'subscription_starts_at' => now()->addMonth()->toDateString(),
            'subscription_ends_at' => now()->addYear()->toDateString(),
        ]))->assertCreated()->assertJsonPath('subscription_status', 'inactive');
    }

    public function test_admin_updates_company_replacing_contacts_and_prolonging_subscription(): void
    {
        $this->actAsAdmin();
        $id = $this->postJson('/admin-panel/companies', $this->companyPayload())->json('id');

        $this->patchJson("/admin-panel/companies/{$id}", [
            'subscription_ends_at' => '2028-10-31',
            'phones' => [['phone' => '+79990000000']],
        ])->assertOk()
            ->assertJsonPath('subscription_ends_at', '2028-10-31')
            ->assertJsonCount(1, 'phones')
            ->assertJsonCount(2, 'messengers');
    }

    public function test_changing_company_email_resets_its_verification(): void
    {
        $this->actAsAdmin();
        $company = Company::factory()->create();

        $this->patchJson("/admin-panel/companies/{$company->id}", ['email' => 'new@example.com'])->assertOk();

        $this->assertFalse($company->fresh()->hasVerifiedEmail());
    }

    public function test_admin_resets_company_password(): void
    {
        $this->actAsAdmin();
        $company = Company::factory()->create();

        $response = $this->postJson("/admin-panel/companies/{$company->id}/reset-password")->assertOk();

        $this->assertTrue(password_verify($response->json('initial_password'), $company->fresh()->password));
    }

    public function test_admin_lists_searches_shows_and_deletes_companies(): void
    {
        $this->actAsAdmin();
        $romashka = Company::factory()->create(['name' => 'Ромашка']);
        Company::factory()->create(['name' => 'Лютик']);
        Employee::factory()->count(2)->for($romashka)->create();
        Integration::factory()->for($romashka)->create();

        $this->getJson('/admin-panel/companies')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/admin-panel/companies?search=Ромашка')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/admin-panel/companies/{$romashka->id}")
            ->assertOk()
            ->assertJsonPath('employees_count', 2)
            ->assertJsonPath('integrations_count', 1);
        $this->getJson("/admin-panel/companies/{$romashka->id}/employees")->assertOk()->assertJsonCount(2);

        $this->deleteJson("/admin-panel/companies/{$romashka->id}")->assertNoContent();
        $this->assertDatabaseMissing('companies', ['id' => $romashka->id]);
        $this->assertDatabaseCount('employees', 0);
    }

    public function test_admin_attaches_integration_to_a_company_and_password_stays_hidden(): void
    {
        $this->actAsAdmin();
        $company = Company::factory()->create();

        $response = $this->postJson('/admin-panel/integrations', [
            'company_id' => $company->id,
            'odata_url' => 'https://1cfresh.test/a/demo/odata/standard.odata',
            'login' => 'admin',
            'password' => 'secret',
        ])->assertCreated()->assertJsonMissingPath('password');

        $integration = Integration::findOrFail($response->json('id'));

        $this->assertSame($company->id, $integration->company_id);
        $this->assertSame('secret', $integration->password);
        $this->assertNotSame('secret', $integration->getRawOriginal('password'));
    }

    public function test_admin_disables_and_edits_an_integration_keeping_the_password(): void
    {
        $this->actAsAdmin();
        $integration = Integration::factory()->create(['password' => 'keep-me']);

        $this->patchJson("/admin-panel/integrations/{$integration->id}", [
            'name' => 'Филиал',
            'is_active' => false,
            'password' => '',
        ])->assertOk()
            ->assertJsonPath('name', 'Филиал')
            ->assertJsonPath('status', 'inactive')
            ->assertJsonMissingPath('password');

        $this->assertSame('keep-me', $integration->fresh()->password);

        $this->patchJson("/admin-panel/integrations/{$integration->id}", ['password' => 'new-one'])->assertOk();
        $this->assertSame('new-one', $integration->fresh()->password);
    }

    public function test_admin_creates_another_administrator(): void
    {
        $this->actAsAdmin();

        $response = $this->postJson('/admin-panel/users', [
            'name' => 'Второй админ',
            'email' => 'admin2@example.com',
            'role_id' => Role::ADMIN_ID,
        ])->assertCreated()->assertJsonPath('is_admin', true);

        $this->assertNotEmpty($response->json('initial_password'));
    }

    public function test_staff_email_cannot_duplicate_a_company_email(): void
    {
        $this->actAsAdmin();
        $company = Company::factory()->create();

        $this->postJson('/admin-panel/users', ['name' => 'X', 'email' => $company->email])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_admin_cannot_delete_or_demote_themselves(): void
    {
        $admin = $this->actAsAdmin();

        $this->deleteJson("/admin-panel/users/{$admin->id}")->assertUnprocessable();
        $this->patchJson("/admin-panel/users/{$admin->id}", ['role_id' => Role::USER_ID])->assertUnprocessable();
    }

    public function test_admin_seeder_creates_admin_from_config_once(): void
    {
        config(['app.default_admin' => ['name' => 'Босс', 'email' => 'boss@example.com', 'password' => 'first-pass1']]);

        $this->seed(AdminSeeder::class);
        config(['app.default_admin.password' => 'other-pass1']);
        $this->seed(AdminSeeder::class);

        $admin = User::where('email', 'boss@example.com')->sole();

        $this->assertTrue($admin->isAdmin());
        $this->assertTrue(password_verify('first-pass1', $admin->password));
    }
}
