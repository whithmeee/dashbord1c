<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Models\Employee;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for the client area (a company or one of its employees).
 *
 * Usage: `company.access` (account + confirmed email), add `:subscription` to also require an active
 * subscription and/or `:owner` to restrict the route to the company itself, not its employees.
 */
class EnsureCompanyAccess
{
    public function handle(Request $request, Closure $next, string ...$requirements): Response
    {
        $account = $request->user();

        if (! $account instanceof Company && ! $account instanceof Employee) {
            abort(404);
        }

        if (in_array('owner', $requirements, true) && ! $account instanceof Company) {
            abort(403, 'Доступно только владельцу компании.');
        }

        $company = $account->ownerCompany();

        if (! $company->hasVerifiedEmail()) {
            return $this->deny('Подтвердите почту компании.', 'email_verification_required');
        }

        if (in_array('subscription', $requirements, true) && ! $company->isSubscriptionActive()) {
            return $this->deny('Подписка компании неактивна.', 'subscription_inactive');
        }

        return $next($request);
    }

    private function deny(string $message, string $code): Response
    {
        return response()->json(['message' => $message, 'code' => $code], 403);
    }
}
