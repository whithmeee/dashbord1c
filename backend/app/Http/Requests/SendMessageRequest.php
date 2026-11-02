<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:2000'],
        ];
    }
}
