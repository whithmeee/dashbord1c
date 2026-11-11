<?php

namespace App\Services;

class OneCWidget
{
    /**
     * @param  list<array{key: string, label: string, type: string}>  $columns
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, mixed>  $totals
     * @return array<string, mixed>
     */
    public static function make(string $title, array $columns, array $rows, array $totals): array
    {
        return [
            'title' => $title,
            'columns' => $columns,
            'rows' => $rows,
            'totals' => (object) $totals,
            'rows_count' => count($rows),
            'columns_count' => count($columns),
        ];
    }
}
