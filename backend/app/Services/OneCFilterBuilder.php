<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;
use Throwable;

class OneCFilterBuilder
{
    private const ISO = 'Y-m-d\TH:i:s';

    private const NUMERIC = ['Decimal', 'Double', 'Single', 'Int16', 'Int32', 'Int64', 'Byte'];

    /**
     * @param  array<string, string>  $types
     *
     * @throws InvalidArgumentException
     */
    public function build(OneCQueryPlan $plan, array $types): string
    {
        $parts = [];

        if ($plan->dateField !== null && $plan->from !== null && $plan->to !== null) {
            $parts[] = "{$plan->dateField} ge datetime'{$plan->from->startOfDay()->format(self::ISO)}'";
            $parts[] = "{$plan->dateField} le datetime'{$plan->to->endOfDay()->format(self::ISO)}'";
        }

        $given = array_column($plan->filters, 'field');
        if ($plan->isDocument && isset($types['Posted']) && ! in_array('Posted', $given, true)) {
            $parts[] = 'Posted eq true';
        }
        if ($plan->isDocument && isset($types['DeletionMark']) && ! in_array('DeletionMark', $given, true)) {
            $parts[] = 'DeletionMark eq false';
        }

        foreach ($plan->filters as $filter) {
            $parts[] = $this->condition($filter['field'], $filter['op'], $filter['value'], $types[$filter['field']]);
        }

        return implode(' and ', $parts);
    }

    private function condition(string $field, string $operator, mixed $value, string $type): string
    {
        $literal = $this->literal($field, $value, $type);

        if ($operator === 'contains') {
            if ($type !== 'String') {
                throw new InvalidArgumentException("contains применим только к строковым полям, а {$field} — {$type}.");
            }

            return "substringof({$literal}, {$field}) eq true";
        }

        $comparable = in_array($type, self::NUMERIC, true) || $type === 'DateTime';
        if (! $comparable && ! in_array($operator, ['eq', 'ne'], true)) {
            throw new InvalidArgumentException("Для поля {$field} ({$type}) доступны только eq и ne.");
        }

        return "{$field} {$operator} {$literal}";
    }

    private function literal(string $field, mixed $value, string $type): string
    {
        return match (true) {
            $type === 'Boolean' => $this->boolean($field, $value),
            $type === 'Guid' => $this->guid($field, $value),
            $type === 'DateTime' => $this->dateTime($field, $value),
            in_array($type, self::NUMERIC, true) => $this->number($field, $value),
            default => "'".str_replace("'", "''", (string) $value)."'",
        };
    }

    private function boolean(string $field, mixed $value): string
    {
        $normalized = is_bool($value) ? $value : (in_array($value, ['true', 'false'], true) ? $value === 'true' : null);
        if ($normalized === null) {
            throw new InvalidArgumentException("Поле {$field} ожидает true или false.");
        }

        return $normalized ? 'true' : 'false';
    }

    private function guid(string $field, mixed $value): string
    {
        if (! is_string($value) || preg_match('/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i', $value) !== 1) {
            throw new InvalidArgumentException("Поле {$field} ожидает GUID.");
        }

        return "guid'{$value}'";
    }

    private function dateTime(string $field, mixed $value): string
    {
        try {
            return "datetime'".CarbonImmutable::parse((string) $value)->format(self::ISO)."'";
        } catch (Throwable) {
            throw new InvalidArgumentException("Поле {$field} ожидает дату YYYY-MM-DD.");
        }
    }

    private function number(string $field, mixed $value): string
    {
        if (! is_numeric($value)) {
            throw new InvalidArgumentException("Поле {$field} ожидает число.");
        }

        return (string) (0 + $value);
    }
}
