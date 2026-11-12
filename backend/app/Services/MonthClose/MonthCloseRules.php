<?php

namespace App\Services\MonthClose;

class MonthCloseRules
{
    public const CHECKS = [
        'unposted' => ['label' => 'Не проведены', 'severity' => 'critical'],
        'no_counterparty' => ['label' => 'Не указан контрагент', 'severity' => 'warning'],
        'zero_amount' => ['label' => 'Нулевая сумма', 'severity' => 'warning'],
        'anomalous_amount' => ['label' => 'Аномальная сумма', 'severity' => 'warning'],
    ];

    private const EMPTY_REF = '00000000-0000-0000-0000-000000000000';

    private const ANOMALY_FACTOR = 10;

    private const ANOMALY_MIN_DOCUMENTS = 10;

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array{check: string, row: array<string, mixed>, message: string}>
     */
    public function analyze(array $rows): array
    {
        $issues = [];
        $median = $this->median($rows);

        foreach ($rows as $row) {
            $posted = $row['Posted'] ?? true;

            if ($posted === false) {
                $issues[] = $this->issue('unposted', $row, 'Документ не проведён.');
            }
            if (array_key_exists('Контрагент_Key', $row) && ($row['Контрагент_Key'] === null || $row['Контрагент_Key'] === self::EMPTY_REF)) {
                $issues[] = $this->issue('no_counterparty', $row, 'В документе не указан контрагент.');
            }
            if (! array_key_exists('СуммаДокумента', $row)) {
                continue;
            }

            $amount = abs((float) $row['СуммаДокумента']);

            if ($posted !== false && $amount == 0.0) {
                $issues[] = $this->issue('zero_amount', $row, 'Проведённый документ с нулевой суммой.');
            } elseif ($median !== null && $amount > $median * self::ANOMALY_FACTOR) {
                $issues[] = $this->issue('anomalous_amount', $row, 'Сумма в '.self::ANOMALY_FACTOR.' раз больше обычной для этого вида документов.');
            }
        }

        return $issues;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function median(array $rows): ?float
    {
        $amounts = [];

        foreach ($rows as $row) {
            $amount = abs((float) ($row['СуммаДокумента'] ?? 0));
            if ($amount > 0) {
                $amounts[] = $amount;
            }
        }

        if (count($amounts) < self::ANOMALY_MIN_DOCUMENTS) {
            return null;
        }

        sort($amounts);
        $middle = intdiv(count($amounts), 2);

        return count($amounts) % 2 === 1 ? $amounts[$middle] : ($amounts[$middle - 1] + $amounts[$middle]) / 2;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{check: string, row: array<string, mixed>, message: string}
     */
    private function issue(string $check, array $row, string $message): array
    {
        return ['check' => $check, 'row' => $row, 'message' => $message];
    }
}
