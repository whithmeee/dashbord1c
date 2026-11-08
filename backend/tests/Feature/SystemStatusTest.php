<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SystemStatusTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
        $this->actingAs($this->company, 'company');
    }

    private function base(string $host, array $attributes = []): Integration
    {
        return Integration::factory()->for($this->company)->create($attributes + [
            'name' => $host,
            'odata_url' => "https://{$host}/odata/standard.odata",
        ]);
    }

    public function test_company_without_bases_is_inactive_with_a_message(): void
    {
        Http::fake();

        $this->getJson('/cabinet/system-status')
            ->assertOk()
            ->assertJsonPath('status', 'inactive')
            ->assertJsonPath('message', 'Не активно: ни одной базы не подключено.')
            ->assertJsonPath('total', 0)
            ->assertJsonPath('integrations', []);
        Http::assertNothingSent();
    }

    public function test_all_bases_answering_means_everything_works(): void
    {
        $this->base('one.test');
        $this->base('two.test');
        Http::fake(['*' => Http::response(['value' => []])]);

        $this->getJson('/cabinet/system-status')
            ->assertOk()
            ->assertJsonPath('status', 'operational')
            ->assertJsonPath('message', 'Все системы работают.')
            ->assertJsonPath('active_count', 2)
            ->assertJsonPath('inactive_count', 0)
            ->assertJsonPath('integrations.0.status', 'active')
            ->assertJsonMissingPath('integrations.0.password');
    }

    public function test_one_dead_base_makes_the_system_degraded_and_is_listed(): void
    {
        $this->base('alive.test');
        $dead = $this->base('dead.test');
        Http::fake([
            'alive.test/*' => Http::response(['value' => []]),
            'dead.test/*' => Http::response('down', 503),
        ]);

        $this->getJson('/cabinet/system-status')
            ->assertOk()
            ->assertJsonPath('status', 'degraded')
            ->assertJsonPath('message', 'Работает частично: активно баз 1 из 2.')
            ->assertJsonPath('integrations.0.name', 'alive.test')
            ->assertJsonPath('integrations.0.status', 'active')
            ->assertJsonPath('integrations.1.id', $dead->id)
            ->assertJsonPath('integrations.1.status', 'inactive')
            ->assertJsonPath('integrations.1.reason', 'unreachable');
    }

    public function test_disabled_base_is_inactive_without_asking_1c(): void
    {
        $this->base('on.test');
        $this->base('off.test', ['is_active' => false]);
        Http::fake(['*' => Http::response(['value' => []])]);

        $this->getJson('/cabinet/system-status')
            ->assertOk()
            ->assertJsonPath('status', 'degraded')
            ->assertJsonPath('integrations.1.reason', 'disabled');
        Http::assertNotSent(fn ($request): bool => str_contains($request->url(), 'off.test'));
    }

    public function test_when_no_base_works_the_system_is_inactive(): void
    {
        $this->base('dead.test');
        $this->base('off.test', ['is_active' => false]);
        Http::fake(['*' => Http::response('down', 500)]);

        $this->getJson('/cabinet/system-status')
            ->assertOk()
            ->assertJsonPath('status', 'inactive')
            ->assertJsonPath('message', 'Не активно: ни одна из баз не работает.')
            ->assertJsonPath('inactive_count', 2);
    }

    public function test_unreachable_server_counts_as_inactive(): void
    {
        $this->base('gone.test');
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $this->getJson('/cabinet/system-status')
            ->assertOk()
            ->assertJsonPath('integrations.0.status', 'inactive')
            ->assertJsonPath('integrations.0.reason', 'unreachable');
    }

    public function test_results_are_cached_between_requests(): void
    {
        $this->base('cached.test');
        Http::fake(['*' => Http::response(['value' => []])]);

        $this->getJson('/cabinet/system-status')->assertOk();
        $this->getJson('/cabinet/system-status')->assertOk()->assertJsonPath('integrations.0.status', 'active');

        Http::assertSentCount(1);
    }

    public function test_employee_sees_the_status_of_their_company_bases_only(): void
    {
        $this->base('mine.test');
        Integration::factory()->create();
        Http::fake(['*' => Http::response(['value' => []])]);
        $this->app['auth']->forgetGuards();
        $this->actingAs(Employee::factory()->for($this->company)->create(), 'employee');

        $this->getJson('/cabinet/system-status')->assertOk()->assertJsonPath('total', 1);
    }

    public function test_guests_cannot_read_the_status(): void
    {
        $this->app['auth']->forgetGuards();
        $this->flushSession();

        $this->getJson('/cabinet/system-status')->assertUnauthorized();
    }
}
