<?php

namespace App\Services;

use Carbon\CarbonImmutable;

final class OneCQueryPlan
{
    /**
     * @param  list<array{field: string, op: string, value: mixed}>  $filters
     * @param  list<string>  $fields
     * @param  list<string>  $groupBy
     * @param  list<array{field: ?string, operation: string, alias: string}>  $metrics
     * @param  array{key: string, direction: string}|null  $orderBy
     * @param  array<string, string>  $references
     */
    public function __construct(
        public readonly string $entity,
        public readonly bool $isDocument,
        public readonly ?string $dateField,
        public readonly ?CarbonImmutable $from,
        public readonly ?CarbonImmutable $to,
        public readonly array $filters,
        public readonly array $fields,
        public readonly array $groupBy,
        public readonly array $metrics,
        public readonly ?array $orderBy,
        public readonly int $limit,
        public readonly array $references,
        public readonly ?string $currencyField,
    ) {}

    public function isAggregate(): bool
    {
        return $this->metrics !== [];
    }

    /**
     * @return list<string>
     */
    public function selectedFields(): array
    {
        if (! $this->isAggregate()) {
            return $this->fields;
        }

        $metricFields = array_filter(array_column($this->metrics, 'field'));

        return array_values(array_unique([...$this->groupBy, ...$metricFields]));
    }
}
