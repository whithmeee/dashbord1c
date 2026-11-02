<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * `login` is the email for staff and companies, or the login of an employee.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ];
    }
}
