<?php

namespace App\Services;

use App\Exceptions\OneCException;
use Carbon\CarbonImmutable;

class OneCSalesReader
{
    private const SALES_DOCUMENT = 'Document_РеализацияТоваровУслуг';

    /** @return list<array<string, mixed>> */
    public function documents(OneCClient $client, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $rows = $client->fetchAll(self::SALES_DOCUMENT, [
            '$select' => 'Ref_Key,Date,Контрагент_Key,Организация_Key,СуммаДокумента,Posted,DeletionMark',
            '$filter' => "Date ge datetime'{$from->startOfDay()->format('Y-m-d\\TH:i:s')}'"
                ." and Date le datetime'{$to->endOfDay()->format('Y-m-d\\TH:i:s')}'"
                .' and Posted eq true and DeletionMark eq false',
        ]);
        $unique = [];

        foreach ($rows as $row) {
            $key = (string) ($row['Ref_Key'] ?? '');
            if ($key === '') {
                throw new OneCException('1С вернула реализацию без Ref_Key.');
            }
            if (isset($unique[$key])) {
                continue;
            }
            if (($row['Posted'] ?? true) === false || ($row['DeletionMark'] ?? false) === true) {
                continue;
            }
            $unique[$key] = $row;
        }

        return array_values($unique);
    }

    public function amountMinor(mixed $value): int
    {
        $raw = str_replace(',', '.', trim((string) $value));
        if (! preg_match('/^-?\d+(?:\.\d+)?$/', $raw)) {
            throw new OneCException('1С вернула реализацию с некорректной суммой.');
        }

        $negative = str_starts_with($raw, '-');
        $unsigned = ltrim($raw, '-');
        [$whole, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '');
        $fraction = str_pad($fraction, 2, '0');
        $roundUp = strlen($fraction) > 2 && (int) $fraction[2] >= 5;
        $minor = ((int) $whole * 100) + (int) substr($fraction, 0, 2);
        if ($roundUp) {
            $minor++;
        }

        return $negative ? -$minor : $minor;
    }
}
