<?php

namespace App\Services\Receivables;

use App\Models\Integration;
use App\Services\OneCClient;
use App\Services\OneCSchemaIndex;
use Carbon\CarbonImmutable;

class ReceivablesInspector
{
    private const SHIPMENTS = ['Document_РеализацияТоваровУслуг'];

    private const PAYMENTS = [
        'Document_ПоступлениеНаРасчетныйСчет',
        'Document_ПоступлениеБезналичныхДенежныхСредств',
        'Document_ПриходныйКассовыйОрдер',
    ];

    private const CUSTOMER_PAYMENT = 'ОплатаПокупателя';

    private const NAME_CHUNK = 25;

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly ReceivablesRules $rules,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function inspect(Integration $integration, CarbonImmutable $month): array
    {
        $client = new OneCClient($integration);
        $schema = $this->schemaIndex->load($client);
        $shipped = $this->rules->sumByCounterparty($this->documents($client, $schema, self::SHIPMENTS, $month));
        $paid = $this->rules->sumByCounterparty($this->documents($client, $schema, self::PAYMENTS, $month, true));
        $positions = $this->rules->analyze($shipped, $paid);
        $names = $this->names($client, $schema, array_column($positions, 'key'));
        $issues = $this->issues($positions, $names);

        return [
            'integration_id' => $integration->id,
            'month' => $month->format('Y-m'),
            'generated_at' => now()->toIso8601String(),
            'shipped' => round(array_sum($shipped), 2),
            'paid' => round(array_sum($paid), 2),
            'outstanding' => round(array_sum(array_column($positions, 'outstanding')), 2),
            'debtors_total' => count(array_filter($positions, fn (array $position): bool => $position['outstanding'] > 0)),
            'counterparties_total' => count($positions),
            'checks' => $this->checks($issues),
            'issues' => $issues,
        ];
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @param  list<string>  $entities
     * @return list<array<string, mixed>>
     */
    private function documents(OneCClient $client, array $schema, array $entities, CarbonImmutable $month, bool $customerPaymentsOnly = false): array
    {
        $from = $month->startOfMonth()->format('Y-m-d\T00:00:00');
        $to = $month->startOfMonth()->addMonth()->format('Y-m-d\T00:00:00');
        $rows = [];

        foreach ($entities as $entity) {
            $fields = $schema[$entity] ?? [];

            if (! isset($fields['Date'], $fields['Контрагент_Key'], $fields['СуммаДокумента'])) {
                continue;
            }

            $filter = "Date ge datetime'{$from}' and Date lt datetime'{$to}' and DeletionMark eq false and Posted eq true";

            if ($customerPaymentsOnly && isset($fields['ВидОперации'])) {
                $filter .= " and ВидОперации eq '".self::CUSTOMER_PAYMENT."'";
            }

            $rows = [...$rows, ...$client->fetchAll($entity, [
                '$filter' => $filter,
                '$select' => 'Ref_Key,Контрагент_Key,СуммаДокумента',
            ], (int) config('services.onec.query_max_pages'))];
        }

        return $rows;
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @param  list<string>  $keys
     * @return array<string, string>
     */
    private function names(OneCClient $client, array $schema, array $keys): array
    {
        if (! isset($schema['Catalog_Контрагенты']['Description'])) {
            return [];
        }

        $names = [];

        foreach (array_chunk($keys, self::NAME_CHUNK) as $chunk) {
            $filter = implode(' or ', array_map(fn (string $key): string => "Ref_Key eq guid'{$key}'", $chunk));

            foreach ($client->fetchAll('Catalog_Контрагенты', ['$filter' => $filter, '$select' => 'Ref_Key,Description'], 1) as $row) {
                $names[$row['Ref_Key']] = (string) $row['Description'];
            }
        }

        return $names;
    }

    /**
     * @param  list<array<string, mixed>>  $positions
     * @param  array<string, string>  $names
     * @return list<array<string, mixed>>
     */
    private function issues(array $positions, array $names): array
    {
        $issues = [];

        foreach ($positions as $position) {
            if ($position['check'] === null) {
                continue;
            }

            $issues[] = [
                'check' => $position['check'],
                'counterparty_key' => $position['key'],
                'counterparty' => $names[$position['key']] ?? 'Контрагент без названия',
                'shipped' => $position['shipped'],
                'paid' => $position['paid'],
                'outstanding' => $position['outstanding'],
                'message' => $position['message'],
            ];
        }

        usort($issues, fn (array $left, array $right): int => $right['outstanding'] <=> $left['outstanding']);

        return $issues;
    }

    /**
     * @param  list<array<string, mixed>>  $issues
     * @return list<array<string, mixed>>
     */
    private function checks(array $issues): array
    {
        $counts = array_count_values(array_column($issues, 'check'));
        $checks = [];

        foreach (ReceivablesRules::CHECKS as $key => $check) {
            $count = $counts[$key] ?? 0;
            $checks[] = [
                'key' => $key,
                'label' => $check['label'],
                'count' => $count,
                'status' => $count === 0 ? 'ok' : $check['severity'],
            ];
        }

        return $checks;
    }
}
