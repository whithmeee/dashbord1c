<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChatRequest extends FormRequest
{
    /**
     * Switching `integration_id` points the chat (and DeepSeek) at another of the company's active databases.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'integration_id' => [
                'sometimes',
                'integer',
                Rule::exists('integrations', 'id')
                    ->where('company_id', $this->user()->ownerCompany()->id)
                    ->where('is_active', true),
            ],
            'title' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
