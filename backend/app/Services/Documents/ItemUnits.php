<?php

namespace App\Services\Documents;

use App\Exceptions\OneCException;
use App\Exceptions\OneCRejectedException;
use App\Services\OneCClient;
use App\Services\OneCSchemaIndex;

class ItemUnits
{
    private const NOMENCLATURE = 'Catalog_Номенклатура';

    private const UNITS = 'Catalog_КлассификаторЕдиницИзмерения';

    private const CARD_FIELD = 'ЕдиницаИзмерения_Key';

    private const CATALOG_LIMIT = 200;

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly NomenclatureDefaults $defaults,
    ) {}

    /**
     * Give every item the unit chosen for it, the unit of its card in 1C and the list of units to choose from.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function apply(OneCClient $client, array $data): array
    {
        try {
            $schema = $this->schemaIndex->load($client);
            $units = $this->catalog($client, $schema);
            $cards = $this->cardUnits($client, $schema, $data['items']);
        } catch (OneCException) {
            $units = [];
            $cards = [];
        }

        $names = array_column($units, 'name', 'key');

        foreach ($data['items'] as $index => $item) {
            $cardKey = $cards[$item['ref_key'] ?? ''] ?? null;
            $chosen = $item['unit_key'] ?? null;
            $key = isset($names[$chosen]) ? $chosen : ($cardKey ?? $this->defaults->unit($units, (string) ($item['unit'] ?? '')));

            $data['items'][$index] = [
                ...$item,
                'unit_key' => $key,
                'unit_name' => $names[$key] ?? null,
                'catalog_unit_key' => $cardKey,
            ];
        }

        $data['units'] = $units;

        return $data;
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @return list<array{key: string, name: string}>
     */
    private function catalog(OneCClient $client, array $schema): array
    {
        if (! isset($schema[self::UNITS])) {
            return [];
        }

        try {
            $rows = $client->fetchTop(self::UNITS, ['$filter' => 'DeletionMark eq false', '$select' => 'Ref_Key,Description'], self::CATALOG_LIMIT);
        } catch (OneCRejectedException) {
            return [];
        }

        return array_values(array_map(
            fn (array $row): array => ['key' => (string) $row['Ref_Key'], 'name' => (string) ($row['Description'] ?? '')],
            array_filter($rows, fn (array $row): bool => isset($row['Ref_Key'])),
        ));
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @param  list<array<string, mixed>>  $items
     * @return array<string, string>
     */
    private function cardUnits(OneCClient $client, array $schema, array $items): array
    {
        $keys = array_values(array_unique(array_filter(array_column($items, 'ref_key'))));

        if ($keys === [] || ! isset($schema[self::NOMENCLATURE][self::CARD_FIELD])) {
            return [];
        }

        $filter = implode(' or ', array_map(fn (string $key): string => "Ref_Key eq guid'{$key}'", $keys));

        try {
            $rows = $client->fetchTop(self::NOMENCLATURE, ['$filter' => $filter, '$select' => 'Ref_Key,'.self::CARD_FIELD], count($keys));
        } catch (OneCRejectedException) {
            return [];
        }

        $units = [];
        foreach ($rows as $row) {
            $unit = $row[self::CARD_FIELD] ?? null;

            if (isset($row['Ref_Key']) && is_string($unit) && $unit !== '' && ! str_starts_with($unit, '00000000-')) {
                $units[(string) $row['Ref_Key']] = $unit;
            }
        }

        return $units;
    }
}
