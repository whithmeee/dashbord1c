<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentDraftRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'data' => ['required', 'array'],
            'data.type' => ['sometimes', 'string', 'in:receipt,invoice'],
            'data.number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'data.date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'data.total' => ['sometimes', 'nullable', 'numeric'],
            'data.counterparty' => ['sometimes', 'array'],
            'data.buyer' => ['sometimes', 'array'],
            'data.items' => ['sometimes', 'array', 'max:50'],
            'data.items.*' => ['array'],
        ];
    }
}
