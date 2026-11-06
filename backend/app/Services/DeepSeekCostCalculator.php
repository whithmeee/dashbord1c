<?php

namespace App\Services;

use App\Models\DeepSeekUsage;
use Carbon\CarbonImmutable;
use DateTimeInterface;

class DeepSeekCostCalculator
{
    /** @return array{estimated_cost_usd_micros: int, pricing_snapshot: array<string, mixed>}|null */
    public function quote(DeepSeekUsage $usage): ?array
    {
        if (! $usage->started_at instanceof DateTimeInterface) {
            return null;
        }

        $pricing = $this->pricing($usage->model, CarbonImmutable::instance($usage->started_at));
        $hit = $this->nonNegativeInteger($usage->cached_tokens);
        $miss = $this->nonNegativeInteger($usage->cache_miss_tokens);
        $prompt = $this->nonNegativeInteger($usage->prompt_tokens);
        $completion = $this->nonNegativeInteger($usage->completion_tokens);
        $total = $this->nonNegativeInteger($usage->total_tokens);
        if ($pricing === null || $hit === null || $miss === null || $prompt === null || $completion === null || $total === null
            || $hit + $miss !== $prompt || $prompt + $completion !== $total) {
            return null;
        }

        $rates = array_map(fn (string $rate): int => $this->microsPerMillion($rate), $pricing['rates']);
        $numerator = ($hit * $rates['cache_hit']) + ($miss * $rates['cache_miss']) + ($completion * $rates['output']);

        return [
            'estimated_cost_usd_micros' => intdiv($numerator + 500_000, 1_000_000),
            'pricing_snapshot' => [
                'model' => $usage->model,
                'period' => $pricing['period'],
                'rates_usd_per_million_tokens' => $pricing['rates'],
                'version' => config('deepseek.pricing_version'),
                'source' => config('deepseek.pricing_source'),
            ],
        ];
    }

    /** @return array{period: string, rates: array{cache_hit: string, cache_miss: string, output: string}}|null */
    private function pricing(string $model, CarbonImmutable $startedAt): ?array
    {
        $models = config("deepseek.pricing.{$model}");
        if (! is_array($models)) {
            return null;
        }

        $utc = $startedAt->setTimezone('UTC');
        $isPeakWindow = ($utc->hour >= 1 && $utc->hour < 4) || ($utc->hour >= 6 && $utc->hour < 10);
        if (! $isPeakWindow || $utc->isWeekend()) {
            $period = 'off_peak';
        } elseif (config('deepseek.chinese_public_holidays') === null) {
            return null;
        } elseif (in_array($utc->toDateString(), config('deepseek.chinese_public_holidays'), true)) {
            $period = 'off_peak';
        } else {
            $period = 'peak';
        }

        $rates = $models[$period] ?? null;

        return is_array($rates) ? ['period' => $period, 'rates' => $rates] : null;
    }

    private function microsPerMillion(string $rate): int
    {
        [$whole, $fraction] = array_pad(explode('.', $rate, 2), 2, '');

        return ((int) $whole * 1_000_000) + (int) str_pad(substr($fraction, 0, 6), 6, '0');
    }

    private function nonNegativeInteger(mixed $value): ?int
    {
        return is_int($value) && $value >= 0 ? $value : null;
    }
}
