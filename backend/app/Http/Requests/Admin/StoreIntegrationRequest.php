<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreIntegrationRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'odata_url' => ['required', 'url', 'max:255'],
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'config_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
