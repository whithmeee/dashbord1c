<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use App\Services\OneCHealthService;
use Illuminate\Http\Request;

class SystemStatusController extends Controller
{
    /**
     * The "System state" card: one overall status with a ready message, plus a short list of the company's
     * 1C databases. `status` is `inactive` (no databases, or none responds), `degraded` (some do not) or `operational`.
     *
     * @return array<string, mixed>
     */
    public function __invoke(Request $request, OneCHealthService $health): array
    {
        $integrations = $request->user()->ownerCompany()->integrations()->orderBy('id')->get();
        $checks = $health->check($integrations);

        $items = $integrations->map(fn ($integration): array => [
            'id' => $integration->id,
            'name' => $integration->name,
            'status' => $checks[$integration->id]['status'],
            'reason' => $checks[$integration->id]['reason'],
            'checked_at' => $checks[$integration->id]['checked_at'],
        ])->all();

        $total = count($items);
        $activeCount = count(array_filter($items, fn (array $item): bool => $item['status'] === 'active'));

        [$status, $message] = match (true) {
            $total === 0 => ['inactive', 'Не активно: ни одной базы не подключено.'],
            $activeCount === 0 => ['inactive', 'Не активно: ни одна из баз не работает.'],
            $activeCount < $total => ['degraded', 'Работает частично: активно баз '.$activeCount.' из '.$total.'.'],
            default => ['operational', 'Все системы работают.'],
        };

        return [
            'status' => $status,
            'message' => $message,
            'total' => $total,
            'active_count' => $activeCount,
            'inactive_count' => $total - $activeCount,
            'integrations' => $items,
        ];
    }
}
