<?php

namespace App\Services\Documents;

class NomenclatureDefaults
{
    public const VAT_RATES = [
        'НДС22' => '22%',
        'НДС20' => '20%',
        'НДС10' => '10%',
        'НДС7' => '7%',
        'НДС5' => '5%',
        'НДС0' => '0%',
        'БезНДС' => 'Без НДС',
    ];

    /**
     * @param  list<array{key: string, name: string}>  $kinds
     */
    public function kind(array $kinds): ?string
    {
        foreach ($kinds as $kind) {
            if (str_contains(mb_strtolower($kind['name']), 'товар')) {
                return $kind['key'];
            }
        }

        return $kinds[0]['key'] ?? null;
    }

    /**
     * @param  list<array{key: string, name: string}>  $units
     */
    public function unit(array $units, string $unit): ?string
    {
        foreach ([$this->unitName($unit), 'шт'] as $name) {
            foreach ($units as $candidate) {
                if ($name !== '' && $this->unitName($candidate['name']) === $name) {
                    return $candidate['key'];
                }
            }
        }

        return null;
    }

    public function vat(string $rate): ?string
    {
        if (preg_match('/без/iu', $rate) === 1) {
            return 'БезНДС';
        }

        return preg_match('/\d+/', $rate, $digits) === 1 && isset(self::VAT_RATES["НДС{$digits[0]}"])
            ? "НДС{$digits[0]}"
            : null;
    }

    public static function sameUnit(string $first, string $second): bool
    {
        return self::unitName($first) === self::unitName($second);
    }

    private static function unitName(string $unit): string
    {
        return rtrim(mb_strtolower(trim($unit)), '.');
    }
}
