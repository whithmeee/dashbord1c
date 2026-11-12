<?php

namespace App\Services\Documents;

use Carbon\CarbonImmutable;

class AccountingProfile implements ConfigurationProfile
{
    private const ENTITIES = [
        'receipt' => 'Document_ПоступлениеТоваровУслуг',
        'invoice' => 'Document_СчетНаОплатуПоставщика',
    ];

    public function key(): string
    {
        return 'accounting';
    }

    public function label(): string
    {
        return 'Бухгалтерия предприятия';
    }

    public function supports(array $schema): bool
    {
        return isset($schema[self::ENTITIES['receipt']], $schema['Catalog_Контрагенты'], $schema['Catalog_Организации']);
    }

    public function entity(string $type, array $schema): ?string
    {
        $entity = self::ENTITIES[$type] ?? null;

        return $entity !== null && isset($schema[$entity]) ? $entity : null;
    }

    public function payload(string $type, array $data, array $fields, array $refs): array
    {
        $date = CarbonImmutable::parse($data['date'])->format('Y-m-d\T00:00:00');
        $values = [
            'Date' => $date,
            'Posted' => false,
            'Организация_Key' => $refs['buyer'],
            'Контрагент_Key' => $refs['counterparty'],
            'ДоговорКонтрагента_Key' => $refs['contract'] ?? null,
            'НомерВходящегоДокумента' => $data['number'],
            'ДатаВходящегоДокумента' => $date,
            'СуммаДокумента' => $data['total'],
            'Комментарий' => 'Создан ассистентом из файла',
        ];

        $payload = array_filter(
            $values,
            fn (mixed $value, string $field): bool => isset($fields[$field]) && $value !== null,
            ARRAY_FILTER_USE_BOTH,
        );

        return $type === 'receipt' ? $payload + ['Товары' => $this->items($data['items'])] : $payload;
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function items(array $items): array
    {
        return array_map(fn (array $item, int $index): array => [
            'LineNumber' => (string) ($index + 1),
            'Номенклатура_Key' => $item['ref_key'],
            'Количество' => $item['quantity'],
            'Цена' => $item['price'],
            'Сумма' => $item['amount'],
        ], $items, array_keys($items));
    }
}
