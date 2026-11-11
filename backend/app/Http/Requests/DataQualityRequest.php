<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DataQualityRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'integration_id' => ['required', 'integer'],
            'refresh' => ['sometimes', 'boolean'],
            'severity' => ['sometimes', 'string', Rule::in(['critical', 'warning', 'info'])],
            'category' => ['sometimes', 'string', Rule::in(['tax_details', 'duplicates', 'contracts'])],
        ];
    }
}
