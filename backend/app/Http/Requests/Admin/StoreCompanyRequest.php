<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\HasContactRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRequest extends FormRequest
{
    use HasContactRules;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:companies,email', 'unique:users,email'],
            'verified' => ['sometimes', 'boolean'],
            'subscription_starts_at' => ['required', 'date_format:Y-m-d'],
            'subscription_ends_at' => ['required', 'date_format:Y-m-d', 'after_or_equal:subscription_starts_at'],
        ] + $this->contactRules();
    }
}
