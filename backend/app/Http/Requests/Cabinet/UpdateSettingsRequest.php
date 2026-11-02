<?php

namespace App\Http\Requests\Cabinet;

use App\Http\Requests\Concerns\HasContactRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    use HasContactRules;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return ['name' => ['sometimes', 'string', 'max:255']] + $this->contactRules();
    }
}
