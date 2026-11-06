<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Company;
use App\Models\DeepSeekUsage;
use App\Models\Employee;
use App\Models\Integration;
use App\Services\DeepSeekUsageAggregationService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeepSeekUsageAggregationTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_and_actor_aggregates_keep_unknown_costs_visible(): void
    {
        $company = Company::factory()->create();
        $employee = Employee::factory()->for($company)->create();
        $chat = Chat::factory()->for(Integration::factory()->for($company))->for($company, 'author')->create();
        $employeeChat = Chat::factory()->for($chat->integration)->for($employee, 'author')->create();
        $foreign = Company::factory()->create();
        $foreignChat = Chat::factory()->for(Integration::factory()->for($foreign))->for($foreign, 'author')->create();

        DeepSeekUsage::create([
            'company_id' => $company->id,
            'actor_type' => 'company',
            'actor_id' => $company->id,
            'chat_id' => $chat->id,
            'call_index' => 1,
            'model' => 'deepseek-flash',
            'prompt_tokens' => 10,
            'completion_tokens' => 5,
            'total_tokens' => 15,
            'status' => DeepSeekUsage::RECORDED,
            'estimated_cost_usd_micros' => 100,
            'started_at' => CarbonImmutable::parse('2026-11-07 12:00:00 UTC'),
        ]);
        DeepSeekUsage::create([
            'company_id' => $company->id,
            'actor_type' => 'employee',
            'actor_id' => $employee->id,
            'chat_id' => $employeeChat->id,
            'call_index' => 1,
            'model' => 'deepseek-flash',
            'status' => DeepSeekUsage::UNKNOWN,
            'started_at' => CarbonImmutable::parse('2026-11-07 12:00:00 UTC'),
        ]);
        DeepSeekUsage::create([
            'company_id' => $foreign->id,
            'actor_type' => 'company',
            'actor_id' => $foreign->id,
            'chat_id' => $foreignChat->id,
            'call_index' => 1,
            'model' => 'deepseek-flash',
            'status' => DeepSeekUsage::RECORDED,
            'estimated_cost_usd_micros' => 999,
            'started_at' => CarbonImmutable::parse('2026-11-07 12:00:00 UTC'),
        ]);

        $service = app(DeepSeekUsageAggregationService::class);
        $companyTotal = $service->forCompany($company->id, CarbonImmutable::parse('2026-11-01'), CarbonImmutable::parse('2026-11-30'));
        $employeeTotal = $service->forActor($company->id, 'employee', $employee->id, CarbonImmutable::parse('2026-11-01'), CarbonImmutable::parse('2026-11-30'));

        $this->assertSame(2, $companyTotal['calls']);
        $this->assertSame(100, $companyTotal['known_cost_usd_micros']);
        $this->assertSame(1, $companyTotal['unknown_cost_calls']);
        $this->assertFalse($companyTotal['cost_is_complete']);
        $this->assertSame(1, $employeeTotal['unknown_cost_calls']);
        $this->assertSame(0, $employeeTotal['known_cost_usd_micros']);
    }
}
