<?php

namespace App\Services;

use App\Models\Integration;
use Carbon\CarbonImmutable;
use InvalidArgumentException;
use Throwable;

/**
 * Tools the AI can call. Each one reads raw data from 1C and does all the math in PHP.
 */
class OneCToolsService
{
    public function __construct(private readonly OneCSalesReader $salesReader) {}

    /**
     * Tool definitions in the OpenAI-compatible format DeepSeek expects.
     *
     * @return list<array<string, mixed>>
     */
    public function definitions(): array
    {
        $period = [
            'date_from' => ['type' => 'string', 'description' => 'Начало периода, YYYY-MM-DD'],
            'date_to' => ['type' => 'string', 'description' => 'Конец периода включительно, YYYY-MM-DD'],
        ];

        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_sales_summary',
                    'description' => 'Выручка по проведённым реализациям за период в разрезе организаций: количество документов, сумма, средний чек.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => $period,
                        'required' => ['date_from', 'date_to'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_top_customers',
                    'description' => 'Топ покупателей по выручке за период по проведённым реализациям.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => $period + [
                            'limit' => ['type' => 'integer', 'description' => 'Сколько покупателей показать, по умолчанию 5'],
                        ],
                        'required' => ['date_from', 'date_to'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Run a tool by name and return its widget.
     *
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     *
     * @throws InvalidArgumentException
     */
    public function execute(Integration $integration, string $tool, array $arguments): array
    {
        $client = new OneCClient($integration);

        return match ($tool) {
            'get_sales_summary' => $this->getSalesSummary($client, ...$this->period($arguments)),
            'get_top_customers' => $this->getTopCustomers(
                $client,
                ...$this->period($arguments),
                limit: max(1, min(50, (int) ($arguments['limit'] ?? 5))),
            ),
            default => throw new InvalidArgumentException("Неизвестный инструмент {$tool}."),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function getSalesSummary(OneCClient $client, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $names = $client->catalogNames('Catalog_Организации');
        $groups = $this->groupSales($client, $from, $to, 'Организация_Key', $names);

        $rows = [];
        foreach ($groups as $name => $group) {
            $rows[] = [
                'name' => $name,
                'documents' => $group['documents'],
                'revenue' => $group['kopecks'] / 100,
                'average' => round($group['kopecks'] / $group['documents']) / 100,
            ];
        }
        usort($rows, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        $documents = array_sum(array_column($rows, 'documents'));
        $kopecks = array_sum(array_column($groups, 'kopecks'));

        return $this->widget(
            title: "Выручка за {$this->periodLabel($from, $to)}",
            columns: [
                ['key' => 'name', 'label' => 'Организация', 'type' => 'string'],
                ['key' => 'documents', 'label' => 'Документов', 'type' => 'integer'],
                ['key' => 'revenue', 'label' => 'Выручка, ₽', 'type' => 'money'],
                ['key' => 'average', 'label' => 'Средний чек, ₽', 'type' => 'money'],
            ],
            rows: $rows,
            totals: [
                'name' => 'Итого',
                'documents' => $documents,
                'revenue' => $kopecks / 100,
                'average' => $documents > 0 ? round($kopecks / $documents) / 100 : 0,
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function getTopCustomers(OneCClient $client, CarbonImmutable $from, CarbonImmutable $to, int $limit): array
    {
        $names = $client->catalogNames('Catalog_Контрагенты');
        $groups = $this->groupSales($client, $from, $to, 'Контрагент_Key', $names);

        uasort($groups, fn (array $a, array $b): int => $b['kopecks'] <=> $a['kopecks']);

        $totalKopecks = array_sum(array_column($groups, 'kopecks'));
        $rows = [];
        foreach (array_slice($groups, 0, $limit, true) as $name => $group) {
            $rows[] = [
                'name' => $name,
                'documents' => $group['documents'],
                'revenue' => $group['kopecks'] / 100,
                'share' => $totalKopecks > 0 ? round($group['kopecks'] / $totalKopecks * 100, 1) : 0,
            ];
        }

        return $this->widget(
            title: "Топ-{$limit} покупателей за {$this->periodLabel($from, $to)}",
            columns: [
                ['key' => 'name', 'label' => 'Покупатель', 'type' => 'string'],
                ['key' => 'documents', 'label' => 'Документов', 'type' => 'integer'],
                ['key' => 'revenue', 'label' => 'Выручка, ₽', 'type' => 'money'],
                ['key' => 'share', 'label' => 'Доля, %', 'type' => 'percent'],
            ],
            rows: $rows,
            totals: [
                'name' => 'Всего по всем покупателям',
                'documents' => array_sum(array_column($groups, 'documents')),
                'revenue' => $totalKopecks / 100,
                'share' => 100,
            ],
        );
    }

    /**
     * Sum posted sales documents per reference. Money is accumulated in integer kopecks.
     *
     * @param  array<string, string>  $names
     * @return array<string, array{documents: int, kopecks: int}>
     */
    private function groupSales(OneCClient $client, CarbonImmutable $from, CarbonImmutable $to, string $keyField, array $names): array
    {
        $documents = $this->salesReader->documents($client, $from, $to);

        $groups = [];
        foreach ($documents as $document) {
            $name = $client->resolveName($names, $document[$keyField] ?? null);
            $groups[$name] ??= ['documents' => 0, 'kopecks' => 0];
            $groups[$name]['documents']++;
            $groups[$name]['kopecks'] += $this->salesReader->amountMinor($document['СуммаДокумента'] ?? null);
        }

        return $groups;
    }

    /**
     * @param  list<array{key: string, label: string, type: string}>  $columns
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, mixed>  $totals
     * @return array<string, mixed>
     */
    private function widget(string $title, array $columns, array $rows, array $totals): array
    {
        return [
            'title' => $title,
            'columns' => $columns,
            'rows' => $rows,
            'totals' => $totals,
            'rows_count' => count($rows),
            'columns_count' => count($columns),
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array{from: CarbonImmutable, to: CarbonImmutable}
     *
     * @throws InvalidArgumentException
     */
    private function period(array $arguments): array
    {
        try {
            $from = CarbonImmutable::parse((string) ($arguments['date_from'] ?? ''));
            $to = CarbonImmutable::parse((string) ($arguments['date_to'] ?? ''));
        } catch (Throwable) {
            throw new InvalidArgumentException('Некорректный период.');
        }

        if ($from->greaterThan($to)) {
            throw new InvalidArgumentException('Начало периода позже его конца.');
        }

        return ['from' => $from, 'to' => $to];
    }

    private function periodLabel(CarbonImmutable $from, CarbonImmutable $to): string
    {
        return $from->format('d.m.Y').' – '.$to->format('d.m.Y');
    }
}
