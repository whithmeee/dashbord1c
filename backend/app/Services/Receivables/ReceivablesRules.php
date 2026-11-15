<?php

namespace App\Services\Receivables;

class ReceivablesRules
{
    public const CHECKS = [
        'unpaid' => ['label' => 'Нет оплаты за месяц', 'severity' => 'critical'],
        'partial' => ['label' => 'Оплачено частично', 'severity' => 'warning'],
        'overpaid' => ['label' => 'Оплат больше отгрузки', 'severity' => 'warning'],
    ];

    private const EMPTY_REF = '00000000-0000-0000-0000-000000000000';

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, float>
     */
    public function sumByCounterparty(array $rows): array
    {
        $sums = [];

        foreach ($rows as $row) {
            $key = $row['Контрагент_Key'] ?? null;

            if (! is_string($key) || $key === '' || $key === self::EMPTY_REF) {
                continue;
            }

            $sums[$key] = ($sums[$key] ?? 0.0) + abs((float) ($row['СуммаДокумента'] ?? 0));
        }

        return $sums;
    }

    /**
     * @param  array<string, float>  $shipped
     * @param  array<string, float>  $paid
     * @return list<array{key: string, shipped: float, paid: float, outstanding: float, check: ?string, message: string}>
     */
    public function analyze(array $shipped, array $paid): array
    {
        $positions = [];

        foreach (array_unique([...array_keys($shipped), ...array_keys($paid)]) as $key) {
            $sold = round($shipped[$key] ?? 0.0, 2);
            $received = round($paid[$key] ?? 0.0, 2);

            $positions[] = [
                'key' => $key,
                'shipped' => $sold,
                'paid' => $received,
                'outstanding' => round(max(0.0, $sold - $received), 2),
                ...$this->verdict($sold, $received),
            ];
        }

        return $positions;
    }

    /**
     * @return array{check: ?string, message: string}
     */
    private function verdict(float $shipped, float $paid): array
    {
        return match (true) {
            $shipped > 0 && $paid == 0.0 => [
                'check' => 'unpaid',
                'message' => 'Отгружено на '.$this->money($shipped).', оплат за месяц нет.',
            ],
            $shipped > $paid => [
                'check' => 'partial',
                'message' => 'Оплачено '.$this->money($paid).' из '.$this->money($shipped).'.',
            ],
            $paid > $shipped => [
                'check' => 'overpaid',
                'message' => 'Оплат больше отгрузки на '.$this->money($paid - $shipped).': возможен аванс или оплата прошлых периодов.',
            ],
            default => ['check' => null, 'message' => ''],
        };
    }

    private function money(float $amount): string
    {
        return number_format($amount, 2, ',', ' ');
    }
}
