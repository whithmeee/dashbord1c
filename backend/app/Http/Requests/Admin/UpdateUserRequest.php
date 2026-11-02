<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'phone_number' => ['sometimes', 'nullable', 'string', 'max:32', Rule::unique('users', 'phone_number')->ignore($user)],
            'role_id' => ['sometimes', 'integer', Rule::in([Role::ADMIN_ID, Role::USER_ID])],
        ];
    }
}
