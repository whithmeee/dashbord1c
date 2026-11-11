<?php

namespace App\Services;

use App\Models\Integration;
use Illuminate\Support\Facades\Cache;

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

        return Cache::remember(
            $key,
            self::CACHE_SECONDS,
            fn (): DataQualitySnapshot => $this->inspector->inspect($integration),
        );
    }
}
