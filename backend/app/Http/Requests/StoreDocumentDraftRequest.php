<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentDraftRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
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
            'file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,txt',
                'max:'.config('services.ocr.max_kilobytes'),
            ],
        ];
    }
}
