<?php

namespace App\Services;

use App\Models\Integration;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Live availability of a company's 1C databases. Results are cached briefly so the dashboard stays fast.
 */
class OneCHealthService
{
    public const REASON_DISABLED = 'disabled';

    public const REASON_UNREACHABLE = 'unreachable';

    /**
     * @param  Collection<int, Integration>  $integrations
     * @return array<int, array{status: string, reason: ?string, checked_at: string}>
     */
    public function check(Collection $integrations): array
    {
        $ttl = (int) config('services.onec.health_cache_ttl');
        $results = [];
        $toProbe = [];

        foreach ($integrations as $integration) {
            if (! $integration->is_active) {
                $results[$integration->id] = $this->result(false, self::REASON_DISABLED);

                continue;
            }

            $cached = Cache::get($this->cacheKey($integration));

            if ($cached !== null) {
                $results[$integration->id] = $cached;

                continue;
            }

            $toProbe[] = $integration;
        }

        foreach ($this->probe($toProbe) as $id => $reachable) {
            $results[$id] = $this->result($reachable, $reachable ? null : self::REASON_UNREACHABLE);
            Cache::put($this->cacheKey($integrations->firstWhere('id', $id)), $results[$id], $ttl);
        }

        return $results;
    }

    /**
     * All databases are asked at once, so the slowest one sets the wait, not their sum.
     *
     * @param  list<Integration>  $integrations
     * @return array<int, bool>
     */
    private function probe(array $integrations): array
    {
        if ($integrations === []) {
            return [];
        }

        $timeout = (int) config('services.onec.health_timeout');

        $responses = Http::pool(function (Pool $pool) use ($integrations, $timeout): void {
            foreach ($integrations as $integration) {
                $pool->as((string) $integration->id)
                    ->withBasicAuth($integration->login, $integration->password)
                    ->acceptJson()
                    ->timeout($timeout)
                    ->get(OneCClient::pingUrl($integration));
            }
        });

        $reachable = [];

        foreach ($integrations as $integration) {
            $response = $responses[(string) $integration->id] ?? null;
            $reachable[$integration->id] = $response instanceof Response && $response->successful();
        }

        return $reachable;
    }

    /**
     * @return array{status: string, reason: ?string, checked_at: string}
     */
    private function result(bool $active, ?string $reason): array
    {
        return [
            'status' => $active ? 'active' : 'inactive',
            'reason' => $reason,
            'checked_at' => now()->toIso8601String(),
        ];
    }

    private function cacheKey(Integration $integration): string
    {
        return "onec:health:{$integration->id}:{$integration->updated_at?->timestamp}";
    }
}
