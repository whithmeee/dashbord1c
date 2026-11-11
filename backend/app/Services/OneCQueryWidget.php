<?php

namespace App\Services;

class OneCQueryWidget
{
    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    public function build(OneCQueryPlan $plan, array $rows, int $fetched): array
    {
        $columns = $this->columns($plan);
        $widget = OneCWidget::make(
            title: $this->title($plan),
            columns: $columns,
            rows: array_slice($rows, 0, $plan->limit),
            totals: $this->totals($plan, $rows, $columns),
        );

        return $widget + [
            'rows_total' => count($rows),
            'fetched_rows' => $fetched,
            'note' => $plan->currencyField !== null || ! $plan->isAggregate()
                ? 'Суммы по разным валютам не складываются.'
                : 'В объекте нет поля валюты: суммы указаны как в 1С, валюта неизвестна.',
        ];
    }

    /**
     * @return list<array{key: string, label: string, type: string}>
     */
    private function columns(OneCQueryPlan $plan): array
    {
        $keys = $plan->isAggregate() ? $plan->groupBy : $plan->fields;
        $columns = array_map(fn (string $key): array => [
            'key' => $key,
            'label' => $key === $plan->currencyField ? 'Валюта' : preg_replace('/_Key$/u', '', $key),
            'type' => 'string',
        ], $keys);

        foreach ($plan->metrics as $metric) {
            $columns[] = ['key' => $metric['alias'], 'label' => $this->metricLabel($metric), 'type' => 'number'];
        }

        return $columns;
    }

    /**
     * @param  array{field: ?string, operation: string, alias: string}  $metric
     */
    private function metricLabel(array $metric): string
    {
        $name = ['sum' => 'Сумма', 'avg' => 'Среднее', 'min' => 'Минимум', 'max' => 'Максимум', 'count' => 'Количество'][$metric['operation']];

        return $metric['field'] === null ? $name : "{$name}: {$metric['field']}";
    }

    private function title(OneCQueryPlan $plan): string
    {
        return $plan->from === null || $plan->to === null
            ? $plan->entity
            : "{$plan->entity}, {$plan->from->format('d.m.Y')} – {$plan->to->format('d.m.Y')}";
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  list<array{key: string, label: string, type: string}>  $columns
     * @return array<string, mixed>
     */
    private function totals(OneCQueryPlan $plan, array $rows, array $columns): array
    {
        $first = $columns[0]['key'] ?? null;
        if ($first === null) {
            return [];
        }

        $additive = $plan->isAggregate() && array_filter(
            $plan->metrics,
            fn (array $metric): bool => ! in_array($metric['operation'], ['sum', 'count'], true),
        ) === [];
        $singleCurrency = $plan->currencyField === null
            || count(array_unique(array_column($rows, $plan->currencyField))) <= 1;

        if (! $additive || ! $singleCurrency) {
            return [$first => 'Строк: '.count($rows)];
        }

        $totals = [$first => 'Итого'];
        foreach ($plan->metrics as $metric) {
            $totals[$metric['alias']] = round(array_sum(array_column($rows, $metric['alias'])), 4);
        }

        return $totals;
    }
}
