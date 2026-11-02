<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps an employee's "online" status fresh, writing at most once a minute.
 */
class TrackLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $account = $request->user();

        if ($account instanceof Employee && ($account->last_seen_at === null || $account->last_seen_at->lt(now()->subMinute()))) {
            $account->forceFill(['last_seen_at' => now()])->saveQuietly();
        }

        return $next($request);
    }
}
