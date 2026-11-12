<?php

namespace App\Services\Documents;

use Carbon\CarbonImmutable;
use Throwable;

class DocumentNormalizer
{
    public const TYPES = ['receipt', 'invoice'];

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    public function normalize(array $raw): array
    {
        $type = (string) ($raw['type'] ?? '');

        return [
            'type' => in_array($type, self::TYPES, true) ? $type : 'receipt',
            'number' => $this->text($raw['number'] ?? null),
            'date' => $this->date($raw['date'] ?? null),
            'counterparty' => $this->party($raw['counterparty'] ?? null),
            'buyer' => $this->party($raw['buyer'] ?? null),
            'items' => $this->items($raw['items'] ?? []),
            'total' => $this->number($raw['total'] ?? null),
        ];
    }

    /**
     * @return array{name: string, inn: string, kpp: string, ref_key: ?string, match: string}
     */
    private function party(mixed $party): array
    {
        $party = is_array($party) ? $party : [];

        return [
            'name' => $this->text($party['name'] ?? null),
            'inn' => preg_replace('/\D/', '', $this->text($party['inn'] ?? null)),
            'kpp' => preg_replace('/\D/', '', $this->text($party['kpp'] ?? null)),
            'ref_key' => null,
            'match' => 'missing',
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function items(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        return array_values(array_map(fn (array $item): array => [
            'name' => $this->text($item['name'] ?? null),
            'quantity' => $this->number($item['quantity'] ?? null),
            'price' => $this->number($item['price'] ?? null),
            'amount' => $this->number($item['amount'] ?? null),
            'vat_rate' => $this->text($item['vat_rate'] ?? null),
            'ref_key' => null,
            'match' => 'missing',
        ], array_slice(array_filter($items, 'is_array'), 0, 50)));
    }

    private function text(mixed $value): string
    {
        return is_scalar($value) ? trim((string) $value) : '';
    }

    private function number(mixed $value): float
    {
        if (is_string($value)) {
            $value = str_replace([' ', "\u{a0}", ','], ['', '', '.'], $value);
        }

        return is_numeric($value) ? round((float) $value, 4) : 0.0;
    }

    private function date(mixed $value): string
    {
        try {
            return CarbonImmutable::parse($this->text($value))->format('Y-m-d');
        } catch (Throwable) {
            return '';
        }
    }
}
