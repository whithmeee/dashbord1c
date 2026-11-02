<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hides the admin panel: anyone who is not a signed-in administrator (including companies and employees) gets a plain 404.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('web');

        if (! $user instanceof User || ! $user->isAdmin()) {
            abort(404);
        }

        return $next($request);
    }
}
