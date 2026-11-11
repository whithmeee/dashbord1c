<?php

namespace App\Services;

use App\Exceptions\OneCException;
use Carbon\CarbonImmutable;

class OneCCashFlowReader
{
    /** @return array{receipts: list<array<string, mixed>>, payments: list<array<string, mixed>>} */
    public function documents(OneCClient $client, CarbonImmutable $from, CarbonImmutable $to): array
    {
        return [
            'receipts' => $this->read($client, 'Document_ПоступлениеНаРасчетныйСчет', $from, $to),
            'payments' => $this->read($client, 'Document_СписаниеСРасчетногоСчета', $from, $to),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function read(OneCClient $client, string $entity, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $rows = $client->fetchAll($entity, [
            '$select' => 'Ref_Key,Date,Организация_Key,ВалютаДокумента_Key,СуммаДокумента,Posted,DeletionMark',
            '$filter' => "Date ge datetime'{$from->startOfDay()->format('Y-m-d\\TH:i:s')}'"
                ." and Date le datetime'{$to->endOfDay()->format('Y-m-d\\TH:i:s')}'"
                .' and Posted eq true and DeletionMark eq false',
        ]);
        $unique = [];

        foreach ($rows as $row) {
            $key = (string) ($row['Ref_Key'] ?? '');
            if ($key === '') {
                throw new OneCException('1С вернула денежный документ без Ref_Key.');
            }
            if (($row['Posted'] ?? true) === false || ($row['DeletionMark'] ?? false) === true) {
                continue;
            }
            $unique[$key] = $row;
        }

        return array_values($unique);
    }
}
