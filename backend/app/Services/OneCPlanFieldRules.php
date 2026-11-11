<?php

namespace App\Services;

use InvalidArgumentException;

class OneCPlanFieldRules
{
    private const NUMERIC = ['Decimal', 'Double', 'Single', 'Int16', 'Int32', 'Int64', 'Byte'];

    private const OPERATIONS = ['sum', 'avg', 'min', 'max', 'count'];

    private const RAW_FIELDS = 8;

    /**
     * @param  array<string, string>  $types
     */
    public function require(string $field, array $types, string $where): void
    {
        if (! isset($types[$field])) {
            throw new InvalidArgumentException("Поле «{$field}» ({$where}) не найдено в объекте или недоступно.");
        }
    }

    /**
     * @param  array<string, string>  $types
     * @return list<string>
     */
    public function list(mixed $fields, array $types, int $max, string $name): array
    {
        if (! is_array($fields) || count($fields) > $max) {
            throw new InvalidArgumentException("{$name} должен быть списком не длиннее {$max}.");
        }

        $result = [];
        foreach ($fields as $field) {
            $this->require((string) $field, $types, $name);
            $result[] = (string) $field;
        }

        return array_values(array_unique($result));
    }

    /**
     * @param  array<string, string>  $types
     * @return list<string>
     */
    public function raw(mixed $fields, array $types): array
    {
        $selected = $this->list($fields, $types, 12, 'fields');

        return $selected !== [] ? $selected : array_slice(array_keys($types), 0, self::RAW_FIELDS);
    }

    /**
     * @param  array<string, string>  $types
     * @return list<array{field: ?string, operation: string, alias: string}>
     */
    public function metrics(mixed $metrics, array $types): array
    {
        if (! is_array($metrics) || count($metrics) > 5) {
            throw new InvalidArgumentException('metrics должен быть списком не длиннее 5.');
        }

        $result = [];
        foreach ($metrics as $metric) {
            $operation = is_array($metric) ? (string) ($metric['operation'] ?? '') : '';
            $field = is_array($metric) && isset($metric['field']) ? (string) $metric['field'] : null;

            if (! in_array($operation, self::OPERATIONS, true)) {
                throw new InvalidArgumentException('operation метрики: '.implode(', ', self::OPERATIONS).'.');
            }
            if ($field !== null) {
                $this->require($field, $types, 'metrics');
            }
            if ($operation !== 'count' && ($field === null || ! in_array($types[$field], self::NUMERIC, true))) {
                throw new InvalidArgumentException("Для {$operation} нужно числовое поле.");
            }
            $result[] = ['field' => $field, 'operation' => $operation, 'alias' => $field === null ? $operation : "{$operation}_{$field}"];
        }

        return $result;
    }

    /**
     * @param  list<array{field: ?string, operation: string, alias: string}>  $metrics
     * @param  array<string, string>  $types
     */
    public function currency(array $metrics, array $types): ?string
    {
        $summed = array_filter($metrics, fn (array $metric): bool => $metric['operation'] !== 'count');
        if ($summed === []) {
            return null;
        }

        foreach (array_keys($types) as $field) {
            if (preg_match('/^Валюта.*_Key$/u', $field) === 1) {
                return $field;
            }
        }

        return null;
    }
}
