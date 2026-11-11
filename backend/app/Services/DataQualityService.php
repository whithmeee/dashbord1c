<?php

namespace App\Services;

use App\Models\Integration;
use Illuminate\Support\Facades\Cache;
use Throwable;

class DataQualityService
{
    private const CACHE_SECONDS = 300;

    public function __construct(private readonly DataQualityInspector $inspector) {}

    public function snapshot(Integration $integration, bool $refresh): DataQualitySnapshot
    {
        $key = "onec:{$integration->id}:data-quality";
        if ($refresh) {
            Cache::forget($key);
        }

        $cached = Cache::get($key);
        if (is_array($cached)) {
            try {
                return DataQualitySnapshot::fromCacheArray($cached);
            } catch (Throwable) {
                Cache::forget($key);
            }
        } elseif ($cached !== null) {
            Cache::forget($key);
        }

        $snapshot = $this->inspector->inspect($integration);
        Cache::put($key, $snapshot->toCacheArray(), self::CACHE_SECONDS);

        return $snapshot;
    }
}
