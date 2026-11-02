<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIntegrationRequest extends FormRequest
{
    /**
     * `is_active` switches the database on and off; an empty `password` keeps the stored one.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'odata_url' => ['sometimes', 'url', 'max:255'],
            'login' => ['sometimes', 'string', 'max:255'],
            'password' => ['sometimes', 'nullable', 'string'],
            'config_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
