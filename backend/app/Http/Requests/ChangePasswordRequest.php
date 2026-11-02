<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! Hash::check((string) $value, $this->user()->getAuthPassword())) {
                        $fail('Текущий пароль указан неверно.');
                    }
                },
            ],
            'password' => ['required', 'string', 'confirmed', 'different:current_password', Password::min(8)->letters()->numbers()],
        ];
    }
}
