<?php

namespace Tests\Unit;

use App\Models\DeepSeekUsage;
use App\Services\DeepSeekCostCalculator;
use Carbon\CarbonImmutable;
use Tests\TestCase;

class DeepSeekCostCalculatorTest extends TestCase
{
    public function test_calculates_cache_hit_miss_and_output_cost_in_microdollars(): void
    {
        $usage = new DeepSeekUsage([
            'model' => 'deepseek-flash',
            'prompt_tokens' => 300,
            'completion_tokens' => 50,
            'cached_tokens' => 100,
            'cache_miss_tokens' => 200,
            'total_tokens' => 350,
            'started_at' => CarbonImmutable::parse('2026-11-07 12:00:00 UTC'),
        ]);

        $quote = app(DeepSeekCostCalculator::class)->quote($usage);

        $this->assertSame(60300, $quote['estimated_cost_usd_micros']);
        $this->assertSame('off_peak', $quote['pricing_snapshot']['period']);
    }

    public function test_peak_price_is_used_and_known_holiday_is_off_peak(): void
    {
        config(['deepseek.chinese_public_holidays' => ['2026-11-06']]);
        $calculator = app(DeepSeekCostCalculator::class);
        $usage = new DeepSeekUsage([
            'model' => 'deepseek-flash',
            'prompt_tokens' => 10,
            'completion_tokens' => 10,
            'cached_tokens' => 0,
            'cache_miss_tokens' => 10,
            'total_tokens' => 20,
        ]);

        $usage->started_at = CarbonImmutable::parse('2026-11-05 02:00:00 UTC');
        $this->assertSame('peak', $calculator->quote($usage)['pricing_snapshot']['period']);
        $usage->started_at = CarbonImmutable::parse('2026-11-06 02:00:00 UTC');
        $this->assertSame('off_peak', $calculator->quote($usage)['pricing_snapshot']['period']);
    }

    public function test_unknown_model_or_unknown_peak_calendar_returns_no_cost(): void
    {
        $usage = new DeepSeekUsage([
            'model' => 'deepseek-chat',
            'prompt_tokens' => 10,
            'completion_tokens' => 10,
            'cached_tokens' => 0,
            'cache_miss_tokens' => 10,
            'total_tokens' => 20,
            'started_at' => CarbonImmutable::parse('2026-11-05 02:00:00 UTC'),
        ]);

        $this->assertNull(app(DeepSeekCostCalculator::class)->quote($usage));
    }

    public function test_inconsistent_or_missing_usage_returns_no_cost(): void
    {
        $usage = new DeepSeekUsage([
            'model' => 'deepseek-flash',
            'prompt_tokens' => 10,
            'completion_tokens' => 2,
            'cached_tokens' => 4,
            'cache_miss_tokens' => 5,
            'total_tokens' => 12,
            'started_at' => CarbonImmutable::parse('2026-11-07 12:00:00 UTC'),
        ]);

        $this->assertNull(app(DeepSeekCostCalculator::class)->quote($usage));
    }
}
