<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CabinetDetailsTest extends TestCase
{
    use RefreshDatabase;

    private function companyWithTerm(string $starts, string $ends): Company
    {
        return Company::factory()->create([
            'subscription_starts_at' => $starts,
            'subscription_ends_at' => $ends,
        ]);
    }

    public function test_subscription_details_for_an_active_term(): void
    {
        $company = $this->companyWithTerm(now()->subDays(9)->toDateString(), now()->addDays(20)->toDateString());
        $this->actingAs($company, 'company');

        $this->getJson('/cabinet/subscription')
            ->assertOk()
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('state', 'active')
            ->assertJsonPath('starts_at', now()->subDays(9)->toDateString())
            ->assertJsonPath('ends_at', now()->addDays(20)->toDateString())
            ->assertJsonPath('total_days', 30)
            ->assertJsonPath('elapsed_days', 10)
            ->assertJsonPath('days_left', 20)
            ->assertJsonPath('progress_percent', 33)
            ->assertJsonPath('expires_soon', false);
    }

    public function test_subscription_ending_today_has_zero_days_left_and_expires_soon(): void
    {
        $this->actingAs($this->companyWithTerm(now()->subDays(29)->toDateString(), now()->toDateString()), 'company');

        $this->getJson('/cabinet/subscription')
            ->assertOk()
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('days_left', 0)
            ->assertJsonPath('elapsed_days', 30)
            ->assertJsonPath('expires_soon', true);
    }

    public function test_expired_and_future_subscriptions_are_inactive_with_no_days_left(): void
    {
        $this->actingAs($this->companyWithTerm(now()->subDays(40)->toDateString(), now()->subDays(10)->toDateString()), 'company');
        $this->getJson('/cabinet/subscription')
            ->assertOk()
            ->assertJsonPath('status', 'inactive')
            ->assertJsonPath('state', 'expired')
            ->assertJsonPath('days_left', 0)
            ->assertJsonPath('progress_percent', 100)
            ->assertJsonPath('expires_soon', false);

        $this->actingAs($this->companyWithTerm(now()->addDays(5)->toDateString(), now()->addDays(35)->toDateString()), 'company');
        $this->getJson('/cabinet/subscription')
            ->assertOk()
            ->assertJsonPath('state', 'not_started')
            ->assertJsonPath('elapsed_days', 0)
            ->assertJsonPath('progress_percent', 0);
    }

    public function test_employee_sees_the_subscription_of_their_company(): void
    {
        $company = $this->companyWithTerm(now()->subDay()->toDateString(), now()->addDays(10)->toDateString());
        $this->actingAs(Employee::factory()->for($company)->create(), 'employee');

        $this->getJson('/cabinet/subscription')->assertOk()->assertJsonPath('days_left', 10);
    }

    public function test_subscription_stays_available_when_it_has_expired_and_requires_a_session(): void
    {
        $this->getJson('/cabinet/subscription')->assertUnauthorized();
    }

    public function test_integrations_show_when_they_were_connected(): void
    {
        $company = Company::factory()->create();
        Integration::factory()->for($company)->create(['created_at' => '2026-10-15 09:30:00']);
        $this->actingAs($company, 'company');

        $this->getJson('/cabinet/integrations')
            ->assertOk()
            ->assertJsonPath('0.connected_at', '2026-10-15T09:30:00.000000Z');
    }

    public function test_employee_details_include_creation_date_and_online_state(): void
    {
        $company = Company::factory()->create();
        $employee = Employee::factory()->for($company)->online()->create();
        $this->actingAs($company, 'company');

        $this->getJson("/cabinet/employees/{$employee->id}")
            ->assertOk()
            ->assertJsonPath('is_online', true)
            ->assertJsonPath('login', $employee->login)
            ->assertJsonStructure(['id', 'name', 'position', 'last_seen_at', 'created_at'])
            ->assertJsonMissingPath('password');
        $this->getJson('/cabinet/employees/'.Employee::factory()->create()->id)->assertNotFound();
    }

    public function test_statistics_summary_and_calendar_month(): void
    {
        $company = Company::factory()->create();
        $chat = Chat::factory()->for(Integration::factory()->for($company))->for($company, 'author')->create();
        Message::factory()->count(3)->for($chat)->create(['created_at' => '2026-10-05 10:00:00']);
        Message::factory()->count(1)->for($chat)->create(['created_at' => '2026-10-20 18:45:00']);
        Message::factory()->count(5)->for($chat)->create(['created_at' => '2026-11-02 10:00:00']);
        $this->actingAs($company, 'company');

        $this->getJson('/cabinet/statistics?month=2026-10')
            ->assertOk()
            ->assertJsonPath('period.from', '2026-10-01')
            ->assertJsonPath('period.to', '2026-10-31')
            ->assertJsonPath('period.group', 'day')
            ->assertJsonPath('total', 4)
            ->assertJsonCount(31, 'by_period')
            ->assertJsonPath('summary.active_days', 2)
            ->assertJsonPath('summary.average_per_day', 0.1)
            ->assertJsonPath('summary.peak_day', ['date' => '2026-10-05', 'requests' => 3])
            ->assertJsonPath('summary.last_request_at', '2026-10-20T18:45:00+00:00');
    }

    public function test_summary_of_an_empty_period(): void
    {
        $this->actingAs(Company::factory()->create(), 'company');

        $this->getJson('/cabinet/statistics?month=2026-01')
            ->assertOk()
            ->assertJsonPath('summary.active_days', 0)
            ->assertJsonPath('summary.average_per_day', 0)
            ->assertJsonPath('summary.peak_day', null)
            ->assertJsonPath('summary.last_request_at', null);
    }

    public function test_month_parameter_is_validated_and_explicit_dates_win(): void
    {
        $this->actingAs(Company::factory()->create(), 'company');

        $this->getJson('/cabinet/statistics?month=2026-13')->assertUnprocessable()->assertJsonValidationErrors('month');
        $this->getJson('/cabinet/statistics?month=2026-10&from=2026-11-01&to=2026-11-03')
            ->assertOk()
            ->assertJsonPath('period.from', '2026-11-01')
            ->assertJsonPath('period.to', '2026-11-03');
    }
}
