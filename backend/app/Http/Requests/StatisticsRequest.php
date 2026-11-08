<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StatisticsRequest extends FormRequest
{
    public const GROUPS = ['hour', 'day', 'week', 'month'];

    private const PRESET_DAYS = ['today' => 1, 'week' => 7, 'month' => 30, 'year' => 365];

    private const MAX_DAYS = 1830;

    private const MAX_HOURLY_DAYS = 7;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'period' => ['sometimes', 'in:'.implode(',', array_keys(self::PRESET_DAYS))],
            'month' => ['sometimes', 'date_format:Y-m'],
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:from'],
            'group' => ['sometimes', 'in:'.implode(',', self::GROUPS)],
            'integration_id' => ['sometimes', 'integer'],
            'company_id' => ['sometimes', 'integer'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $days = $this->spanInDays();

            if ($days > self::MAX_DAYS) {
                $validator->errors()->add('from', 'Период не может быть больше 5 лет.');
            }

            if ($this->groupBy() === 'hour' && $days > self::MAX_HOURLY_DAYS) {
                $validator->errors()->add('group', 'Почасовая группировка доступна для периода до 7 дней.');
            }
        });
    }

    /**
     * Explicit `from`/`to` win, then a calendar `month` (YYYY-MM); otherwise the `period` preset (default month) counts back from `to` (default today).
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public function range(): array
    {
        if ($this->filled('month') && ! $this->filled('from') && ! $this->filled('to')) {
            $month = CarbonImmutable::createFromFormat('!Y-m', $this->input('month'));

            return [$month->startOfMonth(), $month->endOfMonth()->startOfDay()];
        }

        $to = $this->filled('to')
            ? CarbonImmutable::createFromFormat('Y-m-d', $this->input('to'))->startOfDay()
            : CarbonImmutable::today();

        $from = $this->filled('from')
            ? CarbonImmutable::createFromFormat('Y-m-d', $this->input('from'))->startOfDay()
            : $to->subDays(self::PRESET_DAYS[$this->input('period', 'month')] - 1);

        return [$from, $to];
    }

    /**
     * Explicit `group` wins; otherwise picked by the period length to keep the chart readable.
     */
    public function groupBy(): string
    {
        if ($this->filled('group')) {
            return $this->input('group');
        }

        return match (true) {
            $this->spanInDays() <= 1 => 'hour',
            $this->spanInDays() <= 31 => 'day',
            $this->spanInDays() <= 120 => 'week',
            default => 'month',
        };
    }

    private function spanInDays(): int
    {
        [$from, $to] = $this->range();

        return (int) $from->diffInDays($to) + 1;
    }
}
