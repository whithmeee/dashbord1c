<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MonthCloseRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'integration_id' => ['required', 'integer'],
            'month' => ['required', 'date_format:Y-m'],
            'refresh' => ['sometimes', 'boolean'],
        ];
    }
}
