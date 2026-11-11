<?php

namespace App\Services;

class OneCAggregator
{
    private const SCALE = 10000;

    /**
     * Group rows and compute metrics in PHP with integer arithmetic scaled by 10^4.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    public function run(OneCQueryPlan $plan, array $rows): array
    {
        $groups = [];

        foreach ($rows as $row) {
            $values = array_map(fn (string $field): mixed => $row[$field] ?? null, $plan->groupBy);
            $key = (string) json_encode($values);
            $groups[$key] ??= ['values' => $values, 'rows' => []];
            $groups[$key]['rows'][] = $row;
        }

        return array_values(array_map(fn (array $group): array => $this->result($plan, $group), $groups));
    }

    /**
     * @param  array{values: list<mixed>, rows: list<array<string, mixed>>}  $group
     * @return array<string, mixed>
     */
    private function result(OneCQueryPlan $plan, array $group): array
    {
        $result = array_combine($plan->groupBy, $group['values']) ?: [];

        foreach ($plan->metrics as $metric) {
            $result[$metric['alias']] = $this->metric($metric, $group['rows']);
        }

        return $result;
    }

    /**
     * @param  array{field: ?string, operation: string, alias: string}  $metric
     * @param  list<array<string, mixed>>  $rows
     */
    private function metric(array $metric, array $rows): int|float
    {
        $values = $metric['field'] === null
            ? array_fill(0, count($rows), 0)
            : array_values(array_filter(
                array_map(fn (array $row): ?int => $this->scaled($row[$metric['field']] ?? null), $rows),
                fn (?int $value): bool => $value !== null,
            ));

        if ($metric['operation'] === 'count') {
            return count($values);
        }

        if ($values === []) {
            return 0;
        }

        $result = match ($metric['operation']) {
            'sum' => array_sum($values),
            'avg' => array_sum($values) / count($values),
            'min' => min($values),
            default => max($values),
        };

        return round($result / self::SCALE, 4);
    }

    private function scaled(mixed $value): ?int
    {
        return is_numeric($value) ? (int) round((float) $value * self::SCALE) : null;
    }
}
