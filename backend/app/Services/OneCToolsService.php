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
                    'description' => 'Сводка проведённых реализаций за период в разрезе организаций. Денежные показатели доступны только при подтверждённой валюте 1С.',
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
                    'description' => 'Топ покупателей по проведённым реализациям. Денежный рейтинг доступен только при подтверждённой валюте 1С.',
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
        // The current OData contract does not expose currency or a guaranteed amount scale.
        // Fetching documents still preserves the normal 1C availability/error behaviour,
        // but no monetary aggregate may cross the tool boundary.
        $this->salesReader->documents($client, $from, $to);

        return $this->unavailableWidget('Сводка реализаций');
    }

    /**
     * @return array<string, mixed>
     */
    private function getTopCustomers(OneCClient $client, CarbonImmutable $from, CarbonImmutable $to, int $limit): array
    {
        $this->salesReader->documents($client, $from, $to);

        return $this->unavailableWidget("Топ-{$limit} покупателей");
    }

    /** @return array<string, mixed> */
    private function unavailableWidget(string $title): array
    {
        return [
            'title' => $title,
            'columns' => [],
            'rows' => [],
            'totals' => [],
            'rows_count' => 0,
            'columns_count' => 0,
            'status' => 'unavailable',
            'code' => 'currency_unconfirmed',
            'message' => 'Денежные показатели недоступны: валюта документов 1С не подтверждена.',
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
}
