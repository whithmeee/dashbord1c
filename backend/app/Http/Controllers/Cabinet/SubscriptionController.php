<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    private const EXPIRING_SOON_DAYS = 7;

    /**
     * Subscription details for the modal: term, days elapsed and days left.
     * `days_left` is 0 on the last day of the term and for terms that have not started or have ended.
     *
     * @return array<string, mixed>
     */
    public function __invoke(Request $request): array
    {
        $company = $request->user()->ownerCompany();
        $today = now()->startOfDay();
        $starts = $company->subscription_starts_at;
        $ends = $company->subscription_ends_at;
        $state = $company->subscriptionState();

        $totalDays = (int) $starts->diffInDays($ends) + 1;
        $elapsedDays = match ($state) {
            'not_started' => 0,
            'expired' => $totalDays,
            default => (int) $starts->diffInDays($today) + 1,
        };
        $daysLeft = $state === 'active' ? (int) $today->diffInDays($ends) : 0;

        return [
            'status' => $state === 'active' ? 'active' : 'inactive',
            'state' => $state,
            'starts_at' => $starts->toDateString(),
            'ends_at' => $ends->toDateString(),
            'total_days' => $totalDays,
            'elapsed_days' => $elapsedDays,
            'days_left' => $daysLeft,
            'progress_percent' => (int) round($elapsedDays / $totalDays * 100),
            'expires_soon' => $state === 'active' && $daysLeft <= self::EXPIRING_SOON_DAYS,
        ];
    }
}
