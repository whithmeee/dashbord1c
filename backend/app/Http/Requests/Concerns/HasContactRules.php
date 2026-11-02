<?php

namespace App\Http\Requests\Concerns;

trait HasContactRules
{
    /**
     * Validation for the repeatable phones and messengers blocks.
     *
     * @return array<string, array<int, string>>
     */
    protected function contactRules(): array
    {
        return [
            'phones' => ['sometimes', 'array', 'max:10'],
            'phones.*.phone' => ['required', 'string', 'max:32'],
            'phones.*.label' => ['nullable', 'string', 'max:255'],
            'messengers' => ['sometimes', 'array', 'max:10'],
            'messengers.*.name' => ['required', 'string', 'max:50'],
            'messengers.*.contact' => ['required', 'string', 'max:255'],
        ];
    }
}
