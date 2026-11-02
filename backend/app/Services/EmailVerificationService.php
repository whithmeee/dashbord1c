<?php

namespace App\Services;

use App\Models\Company;
use App\Notifications\EmailVerificationCodeNotification;

/**
 * Confirms a company's email with a six digit code typed into the web app.
 */
class EmailVerificationService
{
    private const CODE_LIFETIME_MINUTES = 15;

    private const MAX_ATTEMPTS = 5;

    /**
     * Generate a fresh code, store only its hash and email it. Previous attempts are forgotten.
     */
    public function sendCode(Company $company): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $company->forceFill([
            'email_verification_code_hash' => $this->hash($code),
            'email_verification_code_expires_at' => now()->addMinutes(self::CODE_LIFETIME_MINUTES),
            'email_verification_attempts' => 0,
        ])->save();

        $company->notify(new EmailVerificationCodeNotification($code, self::CODE_LIFETIME_MINUTES));
    }

    /**
     * Check the code. Too many wrong attempts or an expired code require requesting a new one.
     */
    public function verify(Company $company, string $code): bool
    {
        if ($company->hasVerifiedEmail()) {
            return true;
        }

        $hash = $company->email_verification_code_hash;
        $expiresAt = $company->email_verification_code_expires_at;

        if ($hash === null || $expiresAt === null || $expiresAt->isPast()
            || $company->email_verification_attempts >= self::MAX_ATTEMPTS) {
            return false;
        }

        if (! hash_equals($hash, $this->hash($code))) {
            $company->increment('email_verification_attempts');

            return false;
        }

        $company->forceFill([
            'email_verified_at' => now(),
            'email_verification_code_hash' => null,
            'email_verification_code_expires_at' => null,
            'email_verification_attempts' => 0,
        ])->save();

        return true;
    }

    private function hash(string $code): string
    {
        return hash_hmac('sha256', $code, (string) config('app.key'));
    }
}
