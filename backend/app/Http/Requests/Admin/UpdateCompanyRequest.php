<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\HasContactRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    use HasContactRules;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $company = $this->route('company');
        $starts = $this->input('subscription_starts_at', $company->subscription_starts_at->toDateString());

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('companies', 'email')->ignore($company), 'unique:users,email'],
            'subscription_starts_at' => ['sometimes', 'date_format:Y-m-d'],
            'subscription_ends_at' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:'.$starts],
        ] + $this->contactRules();
    }
}
