<?php

namespace App\Services\MonthClose;

use App\Models\Integration;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;

class MonthCloseService
{
    private const CACHE_SECONDS = 600;

    private const DETAILS_LIMIT = 200;

    public function __construct(private readonly MonthCloseInspector $inspector) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(Integration $integration, string $month, bool $refresh): array
    {
        $snapshot = $this->snapshot($integration, $month, $refresh);
        unset($snapshot['issues']);

        return $snapshot;
    }

    /**
     * @return array{check: string, total: int, items: list<array<string, mixed>>}
     */
    public function details(Integration $integration, string $month, string $check): array
    {
        $items = array_values(array_filter(
            $this->snapshot($integration, $month, false)['issues'],
            fn (array $issue): bool => $issue['check'] === $check,
        ));

        return [
            'check' => $check,
            'total' => count($items),
            'items' => array_slice($items, 0, self::DETAILS_LIMIT),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshot(Integration $integration, string $month, bool $refresh): array
    {
        $key = "onec:{$integration->id}:month-close:{$month}";

        if ($refresh) {
            Cache::forget($key);
        }

        return Cache::remember($key, self::CACHE_SECONDS, fn (): array => $this->inspector->inspect(
            $integration,
            CarbonImmutable::createFromFormat('!Y-m', $month),
        ));
    }
}
