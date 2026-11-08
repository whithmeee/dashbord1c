<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use App\Models\Message;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatisticsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Integration $integration;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create(['name' => 'Ромашка']);
        $this->integration = Integration::factory()->for($this->company)->create(['name' => 'Основная']);
    }

    /**
     * Asks `$count` questions (plus one assistant reply that must never be counted) at the given moment.
     */
    private function ask(Model $author, string $when, int $count = 1, ?Integration $integration = null): void
    {
        $chat = Chat::factory()->for($integration ?? $this->integration)->for($author, 'author')->create();

        Message::factory()->count($count)->for($chat)->create(['created_at' => $when]);
        Message::factory()->for($chat)->create(['role' => Message::ROLE_ASSISTANT, 'created_at' => $when]);
    }

    public function test_owner_sees_company_totals_for_the_default_month_split_by_day_and_author(): void
    {
        $employee = Employee::factory()->for($this->company)->create(['name' => 'Иван']);
        $this->ask($this->company, now()->toDateTimeString(), 2);
        $this->ask($employee, now()->subDay()->toDateTimeString());
        $this->ask($this->company, now()->subDays(45)->toDateTimeString(), 5);
        $this->ask(Company::factory()->create(), now()->toDateTimeString(), 9, Integration::factory()->create());
        $this->actingAs($this->company, 'company');

        $response = $this->getJson('/cabinet/statistics')
            ->assertOk()
            ->assertJsonPath('total', 3)
            ->assertJsonPath('period.group', 'day')
            ->assertJsonPath('by_integration.0.name', 'Основная')
            ->assertJsonPath('by_integration.0.requests', 3)
            ->assertJsonPath('by_author.0.type', 'company')
            ->assertJsonPath('by_author.0.name', 'Ромашка')
            ->assertJsonPath('by_author.0.requests', 2)
            ->assertJsonPath('by_author.1.name', 'Иван');

        $this->assertSame(3, array_sum(array_column($response->json('by_period'), 'requests')));
    }

    public function test_week_preset_gives_seven_daily_buckets_with_empty_days_as_zero(): void
    {
        $this->ask($this->company, now()->toDateTimeString(), 2);
        $this->ask($this->company, now()->subDays(8)->toDateTimeString());
        $this->actingAs($this->company, 'company');

        $response = $this->getJson('/cabinet/statistics?period=week')
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonPath('period.group', 'day')
            ->assertJsonCount(7, 'by_period')
            ->assertJsonPath('by_period.6.period', now()->toDateString())
            ->assertJsonPath('by_period.6.requests', 2)
            ->assertJsonPath('by_period.0.requests', 0);
    }

    public function test_today_preset_is_grouped_by_hour(): void
    {
        $this->ask($this->company, now()->setTime(10, 30)->toDateTimeString(), 2);
        $this->ask($this->company, now()->subDay()->setTime(10, 30)->toDateTimeString());
        $this->actingAs($this->company, 'company');

        $this->getJson('/cabinet/statistics?period=today')
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonPath('period.group', 'hour')
            ->assertJsonCount(24, 'by_period')
            ->assertJsonPath('by_period.10.requests', 2)
            ->assertJsonPath('by_period.10.period', now()->format('Y-m-d').' 10:00');
    }

    public function test_year_preset_is_grouped_by_month(): void
    {
        $this->ask($this->company, now()->subMonths(3)->toDateTimeString(), 2);
        $this->ask($this->company, now()->toDateTimeString());
        $this->actingAs($this->company, 'company');

        $response = $this->getJson('/cabinet/statistics?period=year')
            ->assertOk()
            ->assertJsonPath('total', 3)
            ->assertJsonPath('period.group', 'month');

        $byMonth = array_column($response->json('by_period'), 'requests', 'period');
        $this->assertSame(2, $byMonth[now()->subMonths(3)->format('Y-m')]);
        $this->assertSame(1, $byMonth[now()->format('Y-m')]);
    }

    public function test_custom_range_and_weekly_grouping_by_monday(): void
    {
        $this->ask($this->company, '2026-10-28 12:00:00');
        $this->ask($this->company, '2026-11-02 08:00:00', 3);
        $this->ask($this->company, '2026-11-09 08:00:00');
        $this->actingAs($this->company, 'company');

        $this->getJson('/cabinet/statistics?from=2026-10-26&to=2026-11-08&group=week')
            ->assertOk()
            ->assertJsonPath('total', 4)
            ->assertExactJsonStructure(['period', 'total', 'summary', 'by_period', 'by_integration', 'by_author'])
            ->assertJsonPath('by_period', [
                ['period' => '2026-10-26', 'requests' => 1],
                ['period' => '2026-11-02', 'requests' => 3],
            ]);
    }

    public function test_range_filter_includes_both_boundary_days_entirely(): void
    {
        $this->ask($this->company, '2026-11-01 00:00:00');
        $this->ask($this->company, '2026-11-03 23:59:59');
        $this->ask($this->company, '2026-11-04 00:00:00');
        $this->actingAs($this->company, 'company');

        $this->getJson('/cabinet/statistics?from=2026-11-01&to=2026-11-03')->assertOk()->assertJsonPath('total', 2);
    }

    public function test_statistics_can_be_narrowed_to_one_base(): void
    {
        $other = Integration::factory()->for($this->company)->create(['name' => 'Филиал']);
        $this->ask($this->company, now()->toDateTimeString(), 2);
        $this->ask($this->company, now()->toDateTimeString(), 1, $other);
        $this->actingAs($this->company, 'company');

        $this->getJson('/cabinet/statistics')->assertOk()->assertJsonPath('total', 3)->assertJsonCount(2, 'by_integration');
        $this->getJson("/cabinet/statistics?integration_id={$other->id}")
            ->assertOk()->assertJsonPath('total', 1)->assertJsonPath('by_integration.0.name', 'Филиал');
    }

    public function test_employee_sees_only_their_own_requests(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $this->ask($this->company, now()->toDateTimeString(), 4);
        $this->ask($employee, now()->toDateTimeString(), 2);
        $this->actingAs($employee, 'employee');

        $this->getJson('/cabinet/statistics')
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonMissingPath('by_author');
    }

    public function test_statistics_stay_available_with_an_inactive_subscription(): void
    {
        $this->actingAs(Company::factory()->expired()->create(), 'company');

        $this->getJson('/cabinet/statistics')->assertOk()->assertJsonPath('total', 0);
    }

    public function test_statistics_parameters_are_validated(): void
    {
        $this->actingAs($this->company, 'company');

        $this->getJson('/cabinet/statistics?period=decade')->assertUnprocessable()->assertJsonValidationErrors('period');
        $this->getJson('/cabinet/statistics?from=2026-11-05&to=2026-11-01')->assertUnprocessable()->assertJsonValidationErrors('to');
        $this->getJson('/cabinet/statistics?from=05.11.2026')->assertUnprocessable()->assertJsonValidationErrors('from');
        $this->getJson('/cabinet/statistics?period=month&group=hour')->assertUnprocessable()->assertJsonValidationErrors('group');
        $this->getJson('/cabinet/statistics?from=2015-01-01&to=2026-01-01')->assertUnprocessable()->assertJsonValidationErrors('from');
    }

    public function test_admin_sees_the_platform_split_by_company_and_can_filter_one_company(): void
    {
        $this->seed(RoleSeeder::class);
        $other = Company::factory()->create(['name' => 'Лютик']);
        $this->ask($this->company, now()->toDateTimeString(), 3);
        $this->ask($other, now()->toDateTimeString(), 1, Integration::factory()->for($other)->create());
        $this->actingAs(User::factory()->admin()->create());

        $this->getJson('/admin-panel/statistics')
            ->assertOk()
            ->assertJsonPath('total', 4)
            ->assertJsonPath('by_company.0.name', 'Ромашка')
            ->assertJsonPath('by_company.0.requests', 3)
            ->assertJsonPath('by_company.1.name', 'Лютик')
            ->assertJsonMissingPath('by_author');

        $this->getJson("/admin-panel/statistics?company_id={$other->id}&period=week")
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('by_author.0.name', 'Лютик')
            ->assertJsonMissingPath('by_company');
    }

    public function test_admin_statistics_are_hidden_from_clients(): void
    {
        $this->actingAs($this->company, 'company');

        $this->getJson('/admin-panel/statistics')->assertNotFound();
    }
}
