<?php

namespace App\Http\Requests;

use App\Services\TaxNumbers;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCounterpartyTaxDetailsRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'integration_id' => ['required', 'integer'],
            'inn' => ['nullable', 'string', 'required_without_all:kpp,legal_type', $this->numberRule(TaxNumbers::validInn(...), 'ИНН указан неверно: проверьте цифры, контрольная сумма не сходится.')],
            'kpp' => ['nullable', 'string', 'required_without_all:inn,legal_type', $this->numberRule(TaxNumbers::validKpp(...), 'КПП должен состоять из 9 символов, например 770101001.')],
            'legal_type' => ['nullable', 'string', 'required_without_all:inn,kpp', Rule::in(['legal', 'individual'])],
        ];
    }

    /**
     * @param  callable(string): bool  $isValid
     */
    private function numberRule(callable $isValid, string $message): callable
    {
        return function (string $attribute, mixed $value, callable $fail) use ($isValid, $message): void {
            if (is_string($value) && ! $isValid($value)) {
                $fail($message);
            }
        };
    }
}
