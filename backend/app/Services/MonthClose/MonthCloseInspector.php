<?php

namespace App\Services\MonthClose;

use App\Models\Integration;
use App\Services\OneCClient;
use App\Services\OneCSchemaIndex;
use Carbon\CarbonImmutable;

class MonthCloseInspector
{
    private const DOCUMENTS = [
        'Document_РеализацияТоваровУслуг' => 'Реализация товаров и услуг',
        'Document_ПоступлениеТоваровУслуг' => 'Поступление товаров и услуг',
        'Document_СчетФактураВыданный' => 'Счёт-фактура выданный',
        'Document_СчетФактураПолученный' => 'Счёт-фактура полученный',
        'Document_ПоступлениеНаРасчетныйСчет' => 'Поступление на расчётный счёт',
        'Document_СписаниеСРасчетногоСчета' => 'Списание с расчётного счёта',
        'Document_ПриходныйКассовыйОрдер' => 'Приходный кассовый ордер',
        'Document_РасходныйКассовыйОрдер' => 'Расходный кассовый ордер',
        'Document_АвансовыйОтчет' => 'Авансовый отчёт',
    ];

    private const FIELDS = ['Ref_Key', 'Number', 'Date', 'Posted', 'Контрагент_Key', 'СуммаДокумента'];

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly MonthCloseRules $rules,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function inspect(Integration $integration, CarbonImmutable $month): array
    {
        $client = new OneCClient($integration);
        $schema = $this->schemaIndex->load($client);
        $total = 0;
        $issues = [];
        $flagged = [];

        foreach (self::DOCUMENTS as $entity => $label) {
            if (! isset($schema[$entity]['Date'])) {
                continue;
            }

            $rows = $this->documents($client, $entity, array_keys($schema[$entity]), $month);
            $total += count($rows);

            foreach ($this->rules->analyze($rows) as $found) {
                $flagged[$found['row']['Ref_Key']] = true;
                $issues[] = $this->describe($found, $entity, $label);
            }
        }

        return [
            'integration_id' => $integration->id,
            'month' => $month->format('Y-m'),
            'generated_at' => now()->toIso8601String(),
            'documents_total' => $total,
            'documents_flagged' => count($flagged),
            'readiness' => $total === 0 ? 100 : (int) round(100 * ($total - count($flagged)) / $total),
            'checks' => $this->checks($issues),
            'issues' => $issues,
        ];
    }

    /**
     * @param  list<string>  $available
     * @return list<array<string, mixed>>
     */
    private function documents(OneCClient $client, string $entity, array $available, CarbonImmutable $month): array
    {
        $from = $month->startOfMonth()->format('Y-m-d\T00:00:00');
        $to = $month->startOfMonth()->addMonth()->format('Y-m-d\T00:00:00');

        return $client->fetchAll($entity, [
            '$filter' => "Date ge datetime'{$from}' and Date lt datetime'{$to}' and DeletionMark eq false",
            '$select' => implode(',', array_values(array_intersect(self::FIELDS, $available))),
        ], (int) config('services.onec.query_max_pages'));
    }

    /**
     * @param  array{check: string, row: array<string, mixed>, message: string}  $found
     * @return array<string, mixed>
     */
    private function describe(array $found, string $entity, string $label): array
    {
        return [
            'check' => $found['check'],
            'entity' => $entity,
            'entity_label' => $label,
            'ref_key' => $found['row']['Ref_Key'],
            'number' => $found['row']['Number'] ?? null,
            'date' => isset($found['row']['Date']) ? substr((string) $found['row']['Date'], 0, 10) : null,
            'amount' => $found['row']['СуммаДокумента'] ?? null,
            'message' => $found['message'],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $issues
     * @return list<array<string, mixed>>
     */
    private function checks(array $issues): array
    {
        $counts = array_count_values(array_column($issues, 'check'));
        $checks = [];

        foreach (MonthCloseRules::CHECKS as $key => $check) {
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
