<?php

namespace App\Http\Requests\Cabinet;

use App\Enums\CabinetSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * Logins are ASCII letters, digits, dashes and underscores, so they can never be mistaken for an email.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'login' => ['required', 'string', 'alpha_dash:ascii', 'max:64', 'unique:employees,login'],
            'password' => ['required', 'string', Password::min(8)->letters()->numbers()],
            'sections' => ['sometimes', 'array'],
            'sections.*' => ['string', 'distinct', Rule::in(CabinetSection::values())],
        ];
    }
}
