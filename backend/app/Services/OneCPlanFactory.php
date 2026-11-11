<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;
use Throwable;

class OneCPlanFactory
{
    private const FILTER_OPERATORS = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'contains'];

    private const MAX_PERIOD_DAYS = 1100;

    private const DEFAULT_LIMIT = 20;

    private const MAX_LIMIT = 50;

    public function __construct(private readonly OneCPlanFieldRules $fieldRules) {}

    /**
     * @param  array<string, mixed>  $raw
     * @param  array<string, array<string, string>>  $schema
     *
     * @throws InvalidArgumentException
     */
    public function make(array $raw, array $schema): OneCQueryPlan
    {
        $entity = trim((string) ($raw['entity'] ?? ''));
        if (! isset($schema[$entity])) {
            throw new InvalidArgumentException("Объект «{$entity}» не найден или недоступен. Найди точное имя через search_1c_schema.");
        }

        $types = $schema[$entity];
        $isDocument = str_starts_with($entity, 'Document_');
        $dateField = isset($types['Date']) ? 'Date' : (isset($types['Period']) ? 'Period' : null);
        [$from, $to] = $this->period($raw['period'] ?? null, $dateField, $isDocument);
        $filters = $this->filters($raw['filters'] ?? [], $types);

        if ($isDocument && $dateField === null && $filters === []) {
            throw new InvalidArgumentException('У табличной части нет даты: добавь filters, например по Ref_Key документа.');
        }

        $groupBy = $this->fieldRules->list($raw['group_by'] ?? [], $types, 3, 'group_by');
        $metrics = $this->fieldRules->metrics($raw['metrics'] ?? [], $types);
        if ($groupBy !== [] && $metrics === []) {
            $metrics = [['field' => null, 'operation' => 'count', 'alias' => 'count']];
        }

        $currency = $metrics === [] ? null : $this->fieldRules->currency($metrics, $types);
        if ($currency !== null && ! in_array($currency, $groupBy, true)) {
            $groupBy[] = $currency;
        }

        $fields = $metrics === [] ? $this->fieldRules->raw($raw['fields'] ?? [], $types) : [];

        return new OneCQueryPlan(
            entity: $entity,
            isDocument: $isDocument,
            dateField: $dateField,
            from: $from,
            to: $to,
            filters: $filters,
            fields: $fields,
            groupBy: $groupBy,
            metrics: $metrics,
            orderBy: $this->orderBy($raw['order_by'] ?? null, $groupBy, $metrics, $fields),
            limit: max(1, min(self::MAX_LIMIT, (int) ($raw['limit'] ?? self::DEFAULT_LIMIT))),
            references: $this->references($raw['references'] ?? [], $schema),
            currencyField: $currency,
        );
    }

    /**
     * @return array{0: ?CarbonImmutable, 1: ?CarbonImmutable}
     */
    private function period(mixed $period, ?string $dateField, bool $isDocument): array
    {
        if (! is_array($period)) {
            if ($isDocument && $dateField !== null) {
                throw new InvalidArgumentException('Для документов обязателен period: {"from":"YYYY-MM-DD","to":"YYYY-MM-DD"}.');
            }

            return [null, null];
        }

        if ($dateField === null) {
            throw new InvalidArgumentException('У этого объекта нет поля даты, period не применим.');
        }

        $from = $this->date($period['from'] ?? null);
        $to = $this->date($period['to'] ?? null);

        if ($from->greaterThan($to)) {
            throw new InvalidArgumentException('Начало периода позже его конца.');
        }
        if ($from->diffInDays($to) > self::MAX_PERIOD_DAYS) {
            throw new InvalidArgumentException('Период слишком длинный, максимум около трёх лет.');
        }

        return [$from, $to];
    }

    private function date(mixed $value): CarbonImmutable
    {
        try {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', (string) $value);
        } catch (Throwable) {
            $date = false;
        }

        if (! $date instanceof CarbonImmutable) {
            throw new InvalidArgumentException('Даты периода нужны в формате YYYY-MM-DD.');
        }

        return $date;
    }

    /**
     * @param  array<string, string>  $types
     * @return list<array{field: string, op: string, value: mixed}>
     */
    private function filters(mixed $filters, array $types): array
    {
        if (! is_array($filters) || count($filters) > 8) {
            throw new InvalidArgumentException('filters должен быть объектом не более чем из 8 условий.');
        }

        $result = [];
        foreach ($filters as $field => $condition) {
            $field = (string) $field;
            $this->fieldRules->require($field, $types, 'filters');
            $operator = is_array($condition) ? (string) ($condition['op'] ?? 'eq') : 'eq';
            $value = is_array($condition) ? ($condition['value'] ?? null) : $condition;

            if (! in_array($operator, self::FILTER_OPERATORS, true) || $value === null || is_array($value)) {
                throw new InvalidArgumentException("Некорректное условие для {$field}: допустимы op ".implode(', ', self::FILTER_OPERATORS).' и скалярное value.');
            }
            $result[] = ['field' => $field, 'op' => $operator, 'value' => $value];
        }

        return $result;
    }

    /**
     * @param  list<string>  $groupBy
     * @param  list<array{field: ?string, operation: string, alias: string}>  $metrics
     * @param  list<string>  $fields
     * @return array{key: string, direction: string}|null
     */
    private function orderBy(mixed $order, array $groupBy, array $metrics, array $fields): ?array
    {
        $allowed = [...$groupBy, ...array_column($metrics, 'alias'), ...$fields];

        if (! is_array($order)) {
            return $metrics === [] ? null : ['key' => $metrics[0]['alias'], 'direction' => 'desc'];
        }

        $key = (string) ($order['field'] ?? '');
        if (! in_array($key, $allowed, true)) {
            throw new InvalidArgumentException('order_by.field должен быть среди group_by, алиасов метрик или fields.');
        }

        return ['key' => $key, 'direction' => ($order['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc'];
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @return array<string, string>
     */
    private function references(mixed $references, array $schema): array
    {
        if (! is_array($references)) {
            return [];
        }

        $result = [];
        foreach ($references as $field => $catalog) {
            if (is_string($catalog) && str_starts_with($catalog, 'Catalog_') && isset($schema[$catalog])) {
                $result[(string) $field] = $catalog;
            }
        }

        return $result;
    }
}
