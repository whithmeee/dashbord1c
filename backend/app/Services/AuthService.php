<?php

namespace App\Services;

use App\Http\Resources\CompanyResource;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\UserResource;
use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * One login form for three kinds of accounts, each living in its own table and session guard.
 */
class AuthService
{
    public const GUARDS = ['web', 'company', 'employee'];

    /**
     * Find the account whose email (staff, company) or login (employee) matches and whose password is right.
     */
    public function attempt(string $login, string $password): ?Authenticatable
    {
        $account = User::where('email', $login)->first()
            ?? Company::where('email', $login)->first()
            ?? Employee::where('login', $login)->first();

        if (! $account || ! Hash::check($password, $account->getAuthPassword())) {
            return null;
        }

        return $account;
    }

    /**
     * Start a session for the account, ending any other account's session in this browser.
     */
    public function login(Authenticatable $account): void
    {
        foreach (self::GUARDS as $guard) {
            Auth::guard($guard)->logout();
        }

        Auth::guard($this->guardFor($account))->login($account);
    }

    public function guardFor(Authenticatable $account): string
    {
        return match (true) {
            $account instanceof Company => 'company',
            $account instanceof Employee => 'employee',
            default => 'web',
        };
    }

    public function typeOf(Authenticatable $account): string
    {
        return match (true) {
            $account instanceof Company => 'company',
            $account instanceof Employee => 'employee',
            default => 'admin',
        };
    }

    /**
     * The response shape shared by login and "who am I".
     *
     * @return array{type: string, account: array<string, mixed>}
     */
    public function payload(Authenticatable $account): array
    {
        $resource = match (true) {
            $account instanceof Company => new CompanyResource($account->loadMissing(['phones', 'messengers'])),
            $account instanceof Employee => new EmployeeResource($account),
            default => new UserResource($account->loadMissing('role')),
        };

        return ['type' => $this->typeOf($account), 'account' => $resource->resolve()];
    }
}
