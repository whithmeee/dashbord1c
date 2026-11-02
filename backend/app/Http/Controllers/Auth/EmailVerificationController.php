<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyEmailCodeRequest;
use App\Models\Company;
use App\Services\AuthService;
use App\Services\EmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmailVerificationController extends Controller
{
    public function __construct(
        private readonly EmailVerificationService $verification,
        private readonly AuthService $auth,
    ) {}

    /**
     * Confirm the company's email with the six digit code from the message.
     *
     * @return array{type: string, account: array<string, mixed>}
     */
    public function verify(VerifyEmailCodeRequest $request): array
    {
        $company = $this->owner($request);

        if (! $this->verification->verify($company, $request->validated('code'))) {
            throw ValidationException::withMessages(['code' => ['Неверный или просроченный код. Запросите новый.']]);
        }

        return $this->auth->payload($company);
    }

    public function resend(Request $request): JsonResponse
    {
        $company = $this->owner($request);

        if ($company->hasVerifiedEmail()) {
            return response()->json(['message' => 'Почта уже подтверждена.']);
        }

        $this->verification->sendCode($company);

        return response()->json(['message' => 'Код отправлен на почту.']);
    }

    private function owner(Request $request): Company
    {
        $account = $request->user();

        abort_unless($account instanceof Company, 403, 'Почту подтверждает владелец компании.');

        return $account;
    }
}
