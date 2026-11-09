<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Company;
use App\Models\Employee;
use App\Models\EmployeeActivity;
use App\Models\Integration;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeProfileTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
    }

    public function test_login_and_logout_of_an_employee_are_recorded(): void
    {
        Employee::factory()->for($this->company)->create(['login' => 'ivan', 'password' => 'secret-pass1']);

        $this->postJson('/auth/login', ['login' => 'ivan', 'password' => 'secret-pass1'])->assertOk();
        $this->postJson('/auth/logout')->assertOk();

        $this->assertSame(
            [EmployeeActivity::LOGIN, EmployeeActivity::LOGOUT],
            EmployeeActivity::orderBy('id')->pluck('type')->all(),
        );
    }

    public function test_company_login_is_not_recorded_as_employee_activity(): void
    {
        $this->company->forceFill(['password' => 'secret-pass1', 'email' => 'boss@example.test'])->save();

        $this->postJson('/auth/login', ['login' => 'boss@example.test', 'password' => 'secret-pass1'])->assertOk();

        $this->assertDatabaseCount('employee_activities', 0);
    }

    public function test_owner_sees_sign_in_times_and_recent_questions(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $this->recordActivity($employee, EmployeeActivity::LOGIN, '2026-11-10 08:00:00');
        $this->recordActivity($employee, EmployeeActivity::LOGOUT, '2026-11-10 18:00:00');
        $this->askQuestion($employee, 'Какая выручка за октябрь?', '2026-11-10 09:30:00');
        $this->actingAs($this->company, 'company');

        $response = $this->getJson("/cabinet/employees/{$employee->id}/activity")->assertOk();

        $response->assertJsonPath('questions_count', 1)
            ->assertJsonCount(3, 'items')
            ->assertJsonPath('items.0.type', 'logout')
            ->assertJsonPath('items.1.type', 'question')
            ->assertJsonPath('items.1.details', 'Какая выручка за октябрь?')
            ->assertJsonPath('items.2.type', 'login');
        $this->assertStringStartsWith('2026-11-10T08:00:00', $response->json('last_login_at'));
        $this->assertStringStartsWith('2026-11-10T18:00:00', $response->json('last_logout_at'));
    }

    public function test_profile_of_a_never_signed_in_employee_is_empty(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $this->actingAs($this->company, 'company');

        $this->getJson("/cabinet/employees/{$employee->id}/activity")
            ->assertOk()
            ->assertJsonPath('last_login_at', null)
            ->assertJsonPath('last_logout_at', null)
            ->assertJsonPath('questions_count', 0)
            ->assertJsonPath('items', []);
    }

    public function test_activity_of_another_companys_employee_is_not_found(): void
    {
        $stranger = Employee::factory()->create();
        $this->actingAs($this->company, 'company');

        $this->getJson("/cabinet/employees/{$stranger->id}/activity")->assertNotFound();
    }

    public function test_employee_can_not_open_activity(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $this->actingAs($employee, 'employee');

        $this->getJson("/cabinet/employees/{$employee->id}/activity")->assertForbidden();
    }

    public function test_deleting_an_employee_removes_the_activity(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $this->recordActivity($employee, EmployeeActivity::LOGIN, '2026-11-10 08:00:00');
        $this->actingAs($this->company, 'company');

        $this->deleteJson("/cabinet/employees/{$employee->id}")->assertNoContent();

        $this->assertDatabaseCount('employee_activities', 0);
    }

    private function recordActivity(Employee $employee, string $type, string $at): void
    {
        $employee->activities()->create(['type' => $type, 'occurred_at' => $at]);
    }

    private function askQuestion(Employee $employee, string $content, string $at): void
    {
        $integration = Integration::factory()->for($this->company)->create();
        $chat = Chat::factory()->for($employee, 'author')->for($integration)->create();
        Message::factory()->for($chat)->create([
            'integration_id' => $integration->id,
            'role' => Message::ROLE_USER,
            'content' => $content,
            'created_at' => $at,
        ]);
    }
}
