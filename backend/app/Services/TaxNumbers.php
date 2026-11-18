<?php

namespace App\Services;

class TaxNumbers
{
    private const INN_10_WEIGHTS = [2, 4, 10, 3, 5, 9, 4, 6, 8];

    private const INN_12_FIRST_WEIGHTS = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

    private const INN_12_SECOND_WEIGHTS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

    public static function validInn(string $inn): bool
    {
        if (preg_match('/^\d{10}$|^\d{12}$/', $inn) !== 1) {
            return false;
        }

        $digits = array_map('intval', str_split($inn));

        return strlen($inn) === 10
            ? self::checkDigit($digits, self::INN_10_WEIGHTS) === $digits[9]
            : self::checkDigit($digits, self::INN_12_FIRST_WEIGHTS) === $digits[10]
                && self::checkDigit($digits, self::INN_12_SECOND_WEIGHTS) === $digits[11];
    }

    public static function validKpp(string $kpp): bool
    {
        return preg_match('/^\d{4}[\dA-Z]{2}\d{3}$/', $kpp) === 1;
    }

    /**
     * @param  list<int>  $digits
     * @param  list<int>  $weights
     */
    private static function checkDigit(array $digits, array $weights): int
    {
        $sum = 0;

        foreach ($weights as $index => $weight) {
            $sum += $weight * $digits[$index];
        }

        return $sum % 11 % 10;
    }
}
