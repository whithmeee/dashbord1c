<?php

namespace App\Services\Documents;

class VatAmountCorrector
{
    private const RATES = [22, 20, 10, 7, 5];

    private const CENT = 0.01;

    /**
     * Item amounts given without VAT while the document total includes it are raised to the total with VAT.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function correct(array $data): array
    {
        unset($data['vat_adjusted']);

        if ($data['type'] !== 'receipt' || $data['items'] === [] || $data['total'] <= 0) {
            return $data;
        }

        $sum = array_sum(array_column($data['items'], 'amount'));

        if (abs($sum - $data['total']) <= self::CENT) {
            return $data;
        }

        foreach (self::RATES as $rate) {
            if (abs($sum * (1 + $rate / 100) - $data['total']) <= $this->tolerance($data['items'])) {
                return $this->withVat($data, $rate);
            }
        }

        return $data;
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function tolerance(array $items): float
    {
        return self::CENT + self::CENT / 2 * count($items);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withVat(array $data, int $rate): array
    {
        $factor = 1 + $rate / 100;

        foreach ($data['items'] as $index => $item) {
            $data['items'][$index]['amount'] = round($item['amount'] * $factor, 2);
            $data['items'][$index]['price'] = round($item['price'] * $factor, 2);
        }

        $last = array_key_last($data['items']);
        $rest = $data['total'] - array_sum(array_column($data['items'], 'amount'));
        $data['items'][$last]['amount'] = round($data['items'][$last]['amount'] + $rest, 2);
        $data['vat_adjusted'] = "{$rate}%";

        return $data;
    }
}
