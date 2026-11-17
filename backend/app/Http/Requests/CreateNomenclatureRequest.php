<?php

namespace App\Http\Requests;

use App\Services\Documents\NomenclatureDefaults;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateNomenclatureRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.index' => ['required', 'integer', 'min:0'],
            'items.*.kind_key' => ['nullable', 'uuid'],
            'items.*.unit_key' => ['nullable', 'uuid'],
            'items.*.vat_rate' => ['nullable', 'string', Rule::in(array_keys(NomenclatureDefaults::VAT_RATES))],
        ];
    }
}
