<?php

namespace App\Http\Requests\Cabinet;

use App\Enums\CabinetSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateEmployeeRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'position' => ['sometimes', 'string', 'max:255'],
            'login' => ['sometimes', 'string', 'alpha_dash:ascii', 'max:64', Rule::unique('employees', 'login')->ignore($this->route('employee'))],
            'password' => ['sometimes', 'string', Password::min(8)->letters()->numbers()],
            'sections' => ['sometimes', 'array'],
            'sections.*' => ['string', 'distinct', Rule::in(CabinetSection::values())],
        ];
    }
}
