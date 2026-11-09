<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Models\Company;
use App\Models\Employee;
use App\Models\EmployeeActivity;
use App\Services\AuthService;
use App\Services\EmailVerificationService;
use App\Services\EmployeeActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const CODE_RESEND_COOLDOWN_SECONDS = 60;

    public function __construct(private readonly AuthService $auth) {}

    /**
     * One login for staff, companies and employees. A company that has not confirmed its email gets a code by mail.
     *
     * @return array{type: string, account: array<string, mixed>}
     */
    public function login(LoginRequest $request, EmailVerificationService $verification, EmployeeActivityService $activity): array
    {
        $account = $this->auth->attempt($request->validated('login'), $request->validated('password'));

        if ($account === null) {
            throw ValidationException::withMessages(['login' => [trans('auth.failed')]]);
        }

        $this->auth->login($account);
        $request->session()->regenerate();

        if ($account instanceof Employee) {
            $activity->record($account, EmployeeActivity::LOGIN);
        }

        if ($account instanceof Company && ! $account->hasVerifiedEmail()
            && Cache::add("verification-code:{$account->id}", true, self::CODE_RESEND_COOLDOWN_SECONDS)) {
            $verification->sendCode($account);
        }

        return $this->auth->payload($account);
    }

    public function logout(Request $request, EmployeeActivityService $activity): JsonResponse
    {
        $account = $request->user();

        if ($account instanceof Employee) {
            $activity->record($account, EmployeeActivity::LOGOUT);
            $account->forceFill(['last_seen_at' => null])->saveQuietly();
        }

        foreach (AuthService::GUARDS as $guard) {
            Auth::guard($guard)->logout();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Вы вышли из системы.']);
    }

    /**
     * @return array{type: string, account: array<string, mixed>}
     */
    public function me(Request $request): array
    {
        return $this->auth->payload($request->user());
    }

    /**
     * Optional for everyone: change the password, e.g. the temporary one issued by the administration.
     *
     * @return array{type: string, account: array<string, mixed>}
     */
    public function changePassword(ChangePasswordRequest $request): array
    {
        $account = $request->user();

        $account->forceFill(['password' => $request->validated('password')])->save();

        Auth::guard($this->auth->guardFor($account))->logoutOtherDevices($request->validated('password'));

        return $this->auth->payload($account);
    }
}
