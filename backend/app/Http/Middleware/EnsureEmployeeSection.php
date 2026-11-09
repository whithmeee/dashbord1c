<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmployeeSection
{
    public function handle(Request $request, Closure $next, string $section): Response
    {
        $account = $request->user();

        if ($account instanceof Employee && ! $account->hasSection($section)) {
            abort(404);
        }

        return $next($request);
    }
}
