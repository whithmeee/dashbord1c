<?php

namespace App\Services;

use InvalidArgumentException;

class OneCQueryTool
{
    private const EMPTY_REF = '00000000-0000-0000-0000-000000000000';

    public function __construct(
        private readonly OneCSchemaIndex $index,
        private readonly OneCPlanFactory $planFactory,
        private readonly OneCFilterBuilder $filterBuilder,
        private readonly OneCAggregator $aggregator,
        private readonly OneCReferenceResolver $resolver,
        private readonly OneCQueryWidget $widget,
    ) {}

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     *
     * @throws InvalidArgumentException
     */
    public function query(OneCClient $client, array $arguments): array
    {
        $schema = $this->index->load($client);
        $plan = $this->planFactory->make($arguments, $schema);
        $types = $schema[$plan->entity];
        $options = $this->options($plan, $types);

        if ($plan->isAggregate()) {
            $fetched = $client->fetchAll($plan->entity, $options, (int) config('services.onec.query_max_pages'));
            $rows = $this->aggregator->run($plan, $fetched);
            $columns = $plan->groupBy;
        } else {
            $fetched = $client->fetchTop($plan->entity, $options + $this->ordering($plan), $plan->limit);
            $rows = array_map(fn (array $row): array => array_intersect_key($row, array_flip($plan->fields)), $fetched);
            $columns = $plan->fields;
        }

        $rows = $this->withNames($client, $plan, $schema, $columns, $rows);
        $rows = $plan->isAggregate() ? $this->sorted($plan, $rows) : $rows;

        return $this->widget->build($plan, $rows, count($fetched));
    }

    /**
     * @param  array<string, string>  $types
     * @return array<string, string>
     */
    private function options(OneCQueryPlan $plan, array $types): array
    {
        $options = [];
        $select = $plan->selectedFields() ?: [(string) array_key_first($types)];
        $options['$select'] = implode(',', $select);

        $filter = $this->filterBuilder->build($plan, $types);
        if ($filter !== '') {
            $options['$filter'] = $filter;
        }

        return $options;
    }

    /**
     * @return array<string, string>
     */
    private function ordering(OneCQueryPlan $plan): array
    {
        return $plan->orderBy === null ? [] : ['$orderby' => "{$plan->orderBy['key']} {$plan->orderBy['direction']}"];
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @param  list<string>  $columns
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function withNames(OneCClient $client, OneCQueryPlan $plan, array $schema, array $columns, array $rows): array
    {
        $references = array_values(array_filter($columns, fn (string $column): bool => str_ends_with($column, '_Key')));
        $names = $this->resolver->names($client, $references, $plan->references, $schema);

        return array_map(function (array $row) use ($names): array {
            foreach ($names as $column => $map) {
                $value = $row[$column] ?? null;
                $row[$column] = $value === self::EMPTY_REF ? 'Не указан' : ($map[$value] ?? $value);
            }

            return $row;
        }, $rows);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function sorted(OneCQueryPlan $plan, array $rows): array
    {
        if ($plan->orderBy === null) {
            return $rows;
        }

        $key = $plan->orderBy['key'];
        $direction = $plan->orderBy['direction'] === 'asc' ? 1 : -1;
        usort($rows, fn (array $a, array $b): int => $direction * ($a[$key] <=> $b[$key]));

        return $rows;
    }
}
