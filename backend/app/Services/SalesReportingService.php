<?php

namespace App\Services;

use App\Exceptions\OneCException;
use App\Models\Integration;
use Carbon\CarbonImmutable;

class SalesReportingService
{
    public function __construct(
        private readonly OneCSalesReader $salesReader,
        private readonly OneCCashFlowReader $cashFlowReader,
    ) {}

    /** @return array<string, mixed> */
    public function report(
        Integration $integration,
        ?CarbonImmutable $from,
        ?CarbonImmutable $to,
        ?string $requestedCurrencyKey = null,
        int $months = 6,
    ): array {
        $client = new OneCClient($integration);
        $latest = $this->salesReader->latestDate($client);

        if ($from === null || $to === null) {
            if ($latest === null) {
                return $this->emptyReport($integration, $requestedCurrencyKey);
            }
            $to = $latest->endOfMonth();
            $from = $to->startOfMonth()->subMonths($months - 1);
        }

        $documents = $this->salesReader->documents($client, $from, $to);
        $currencyNames = $client->catalogNames('Catalog_Валюты');
        $customerNames = $client->catalogNames('Catalog_Контрагенты');
        $organizationNames = $client->catalogNames('Catalog_Организации');
        $currencies = $this->currencies($documents, $currencyNames);
        $currencyKey = $this->selectCurrency($currencies, $requestedCurrencyKey);
        $selected = $this->forCurrency($documents, $currencyKey);
        $cash = $this->cashFlowReader->documents($client, $from, $to);

        return [
            'integration_id' => $integration->id,
            'available_period' => $latest === null ? null : ['to' => $latest->toDateString()],
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'financial_status' => $currencyKey === null ? 'empty' : 'available',
            'financial_status_code' => null,
            'money' => [
                'currency_key' => $currencyKey,
                'currency' => $currencyKey === null ? null : ($currencyNames[$currencyKey] ?? 'Неизвестная валюта'),
                'currency_status' => 'separated_by_document_currency',
                'amount_scale' => null,
                'unit' => 'odata_document_amount',
            ],
            'currencies' => $currencies,
            'metrics' => [
                'sales_documents' => count($selected),
                'customers' => count($this->keys($selected, 'Контрагент_Key')),
                'organizations' => count($this->keys($selected, 'Организация_Key')),
            ],
            'monthly' => $this->monthly($selected, $from, $to),
            'customers' => $this->ranked($selected, 'Контрагент_Key', $customerNames, 10),
            'organizations' => $this->ranked($selected, 'Организация_Key', $organizationNames, 10),
            'receipts' => $this->monthly($this->forCurrency($cash['receipts'], $currencyKey), $from, $to),
            'payments' => $this->monthly($this->forCurrency($cash['payments'], $currencyKey), $from, $to),
            'total_amount' => $this->sum($selected),
        ];
    }

    /** @return array<string, mixed> */
    private function emptyReport(Integration $integration, ?string $currencyKey): array
    {
        return [
            'integration_id' => $integration->id,
            'available_period' => null,
            'period' => null,
            'financial_status' => 'empty',
            'financial_status_code' => null,
            'money' => [
                'currency_key' => $currencyKey,
                'currency' => null,
                'currency_status' => 'no_documents',
                'amount_scale' => null,
                'unit' => 'odata_document_amount',
            ],
            'currencies' => [],
            'metrics' => ['sales_documents' => 0, 'customers' => 0, 'organizations' => 0],
            'monthly' => [],
            'customers' => [],
            'organizations' => [],
            'receipts' => [],
            'payments' => [],
            'total_amount' => '0.00',
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $documents
     * @param  array<string, string>  $names
     * @return list<array{key: string, name: string, document_count: int}>
     */
    private function currencies(array $documents, array $names): array
    {
        $counts = [];
        foreach ($documents as $document) {
            $key = (string) ($document['ВалютаДокумента_Key'] ?? '');
            if ($key !== '') {
                $counts[$key] = ($counts[$key] ?? 0) + 1;
            }
        }
        arsort($counts);

        return array_map(
            fn (string $key, int $count): array => [
                'key' => $key,
                'name' => $names[$key] ?? 'Неизвестная валюта',
                'document_count' => $count,
            ],
            array_keys($counts),
            array_values($counts),
        );
    }

    /** @param list<array{key: string, name: string, document_count: int}> $currencies */
    private function selectCurrency(array $currencies, ?string $requested): ?string
    {
        if ($requested !== null) {
            foreach ($currencies as $currency) {
                if ($currency['key'] === $requested) {
                    return $requested;
                }
            }
        }

        return $currencies[0]['key'] ?? null;
    }

    /** @param list<array<string, mixed>> $rows @return list<array<string, mixed>> */
    private function forCurrency(array $rows, ?string $currencyKey): array
    {
        if ($currencyKey === null) {
            return [];
        }

        return array_values(array_filter(
            $rows,
            fn (array $row): bool => (string) ($row['ВалютаДокумента_Key'] ?? '') === $currencyKey,
        ));
    }

    /** @param list<array<string, mixed>> $rows @return list<array{period: string, amount: string, document_count: int}> */
    private function monthly(array $rows, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $period = CarbonImmutable::parse((string) $row['Date'])->format('Y-m');
            $grouped[$period][] = $row;
        }
        $result = [];
        for ($month = $from->startOfMonth(); $month->lessThanOrEqualTo($to); $month = $month->addMonth()) {
            $period = $month->format('Y-m');
            $periodRows = $grouped[$period] ?? [];
            $result[] = [
                'period' => $period,
                'amount' => $this->sum($periodRows),
                'document_count' => count($periodRows),
            ];
        }

        return $result;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, string>  $names
     * @return list<array{key: string, name: string, amount: string, document_count: int}>
     */
    private function ranked(array $rows, string $field, array $names, int $limit): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $key = (string) ($row[$field] ?? '');
            if ($key !== '') {
                $grouped[$key][] = $row;
            }
        }
        $result = [];
        foreach ($grouped as $key => $items) {
            $result[] = [
                'key' => $key,
                'name' => $names[$key] ?? 'Неизвестно',
                'amount' => $this->sum($items),
                'document_count' => count($items),
            ];
        }
        usort($result, fn (array $left, array $right): int => (float) $right['amount'] <=> (float) $left['amount']);

        return array_slice($result, 0, $limit);
    }

    /** @param list<array<string, mixed>> $rows */
    private function sum(array $rows): string
    {
        $values = array_map(function (array $row): string {
            $value = str_replace(',', '.', trim((string) ($row['СуммаДокумента'] ?? '')));
            if (! preg_match('/^-?\d+(?:\.\d+)?$/', $value)) {
                throw new OneCException('1С вернула документ с некорректной суммой.');
            }

            return $value;
        }, $rows);
        $scales = array_map(function (string $value): int {
            $fraction = explode('.', ltrim($value, '-'), 2)[1] ?? '';

            return strlen($fraction);
        }, $values);
        $scale = max([2, ...$scales]);
        $sum = 0;
        foreach ($values as $value) {
            $negative = str_starts_with($value, '-');
            [$whole, $fraction] = array_pad(explode('.', ltrim($value, '-'), 2), 2, '');
            $scaled = (int) ($whole.str_pad($fraction, $scale, '0'));
            $sum += $negative ? -$scaled : $scaled;
        }
        $absolute = str_pad((string) abs($sum), $scale + 1, '0', STR_PAD_LEFT);
        $whole = substr($absolute, 0, -$scale);
        $fraction = substr($absolute, -$scale);

        return ($sum < 0 ? '-' : '').$whole.'.'.$fraction;
    }

    /** @param list<array<string, mixed>> $rows @return list<string> */
    private function keys(array $rows, string $field): array
    {
        return array_values(array_unique(array_filter(array_map(
            fn (array $row): string => (string) ($row[$field] ?? ''),
            $rows,
        ))));
    }
}
