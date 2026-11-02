<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email', 'unique:companies,email'],
            'phone_number' => ['nullable', 'string', 'max:32', 'unique:users,phone_number'],
            'role_id' => ['sometimes', 'integer', Rule::in([Role::ADMIN_ID, Role::USER_ID])],
        ];
    }
}
