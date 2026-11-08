<?php

namespace App\Services;

use App\Models\Integration;
use Carbon\CarbonImmutable;

class SalesReportingService
{
    public function __construct(private readonly OneCSalesReader $salesReader) {}

    /**
     * @return array<string, mixed>
     */
    public function report(Integration $integration, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $client = new OneCClient($integration);
        $documents = $this->salesReader->documents($client, $from, $to);
        $names = $client->catalogNames('Catalog_Контрагенты');
        $monthly = [];
        $customers = [];
        $total = 0;

        foreach ($documents as $document) {
            $amount = $this->salesReader->amountMinor($document['СуммаДокумента'] ?? null);
            $date = $this->documentDate($document['Date'] ?? null);
            $month = $date->format('Y-m');
            $monthly[$month] = ($monthly[$month] ?? 0) + $amount;
            $name = $client->resolveName($names, isset($document['Контрагент_Key']) ? (string) $document['Контрагент_Key'] : null);
            $customers[$name] = ($customers[$name] ?? 0) + $amount;
            $total += $amount;
        }

        ksort($monthly);
        arsort($customers, SORT_NUMERIC);
        $allCustomersTotal = array_sum($customers);

        return [
            'integration_id' => $integration->id,
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'money' => [
                'currency' => null,
                'currency_status' => 'not_provided_by_current_odata',
                'amount_scale' => 2,
                'unit' => 'minor_units',
            ],
            'monthly' => array_map(
                fn (string $period, int $amount): array => ['period' => $period, 'amount_minor' => $amount],
                array_keys($monthly),
                array_values($monthly),
            ),
            'total_amount_minor' => $total,
            'customers' => array_map(
                fn (string $name, int $amount): array => ['name' => $name, 'amount_minor' => $amount],
                array_keys(array_slice($customers, 0, 5, true)),
                array_values(array_slice($customers, 0, 5, true)),
            ),
            'customers_total_amount_minor' => $allCustomersTotal,
        ];
    }

    private function documentDate(mixed $value): CarbonImmutable
    {
        try {
            return CarbonImmutable::parse((string) $value);
        } catch (\Throwable) {
            throw new OneCException('1С вернула реализацию без корректной даты.');
        }
    }
}
