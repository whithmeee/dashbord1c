<?php

namespace App\Services;

use App\Models\DeepSeekUsage;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class DeepSeekUsageAggregationService
{
    /** @return array<string, int|bool> */
    public function forCompany(int $companyId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        return $this->summarize(
            DeepSeekUsage::query()->where('company_id', $companyId),
            $from,
            $to,
        );
    }

    /** @return array<string, int|bool> */
    public function forActor(int $companyId, string $actorType, int $actorId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        return $this->summarize(
            DeepSeekUsage::query()
                ->where('company_id', $companyId)
                ->where('actor_type', $actorType)
                ->where('actor_id', $actorId),
            $from,
            $to,
        );
    }

    /** @return array<string, int|bool> */
    private function summarize(Builder $query, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $scoped = $query->whereBetween('started_at', [$from->startOfDay(), $to->endOfDay()]);
        $calls = (clone $scoped)->count();
        $unknownCostCalls = (clone $scoped)
            ->where(fn (Builder $builder) => $builder->whereNull('estimated_cost_usd_micros')->orWhere('status', DeepSeekUsage::UNKNOWN))
            ->count();

        return [
            'calls' => $calls,
            'prompt_tokens' => (int) ((clone $scoped)->sum('prompt_tokens')),
            'completion_tokens' => (int) ((clone $scoped)->sum('completion_tokens')),
            'known_cost_usd_micros' => (int) ((clone $scoped)->whereNotNull('estimated_cost_usd_micros')->sum('estimated_cost_usd_micros')),
            'unknown_usage_calls' => (int) ((clone $scoped)->where('status', DeepSeekUsage::UNKNOWN)->count()),
            'unknown_cost_calls' => $unknownCostCalls,
            'cost_is_complete' => $unknownCostCalls === 0,
        ];
    }
}
