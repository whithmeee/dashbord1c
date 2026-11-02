<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChatRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'integration_id' => [
                'required',
                'integer',
                Rule::exists('integrations', 'id')
                    ->where('company_id', $this->user()->ownerCompany()->id)
                    ->where('is_active', true),
            ],
            'title' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
