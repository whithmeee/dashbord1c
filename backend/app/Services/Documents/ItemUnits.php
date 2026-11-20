<?php

namespace App\Services\Documents;

use App\Exceptions\OneCException;
use App\Exceptions\OneCRejectedException;
use App\Services\OneCClient;
use App\Services\OneCSchemaIndex;
use Illuminate\Support\Facades\Log;

class ItemUnits
{
    private const NOMENCLATURE = 'Catalog_Номенклатура';

    private const CARD_FIELD = 'ЕдиницаИзмерения_Key';

    private const OWNER_FIELD = 'Owner_Key';

    private const CATALOG_LIMIT = 200;

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly NomenclatureDefaults $defaults,
    ) {}

    /**
     * Give every item the unit of its card in 1C and, when the base allows it safely, the units to choose from.
     *
     * The choice is offered only where the unit of the card and the unit of the document row refer to the same
     * catalog; otherwise the unit is shown read-only and never written.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function apply(OneCClient $client, array $data, ?string $documentEntity = null): array
    {
        try {
            $plan = $this->plan($client, $documentEntity);
            $cards = $this->cardUnits($client, $plan, $data['items']);
            $shared = $plan['editable'] && ! $plan['owned'] ? $this->catalog($client, $plan['catalog'], null) : [];
            $owned = $plan['editable'] && $plan['owned'] ? $this->ownedChoices($client, $plan['catalog'], $data['items']) : [];
            $names = $this->names($client, $plan['catalog'], $cards, [...$shared, ...array_merge([], ...array_values($owned))]);
        } catch (OneCException) {
            $plan = ['catalog' => null, 'editable' => false, 'owned' => false];
            $cards = $shared = $owned = $names = [];
        }

        foreach ($data['items'] as $index => $item) {
            $card = $cards[$item['ref_key'] ?? ''] ?? null;
            $choices = $plan['owned'] ? ($owned[$item['ref_key'] ?? ''] ?? []) : $shared;
            $key = $this->chosen($plan['editable'], $item, $card, $choices);

            $data['items'][$index] = [
                ...$item,
                'unit_key' => $key,
                'unit_name' => $key === null ? null : ($names[$key] ?? null),
                'catalog_unit_key' => $card,
                'unit_choices' => $plan['owned'] && $plan['editable'] ? $choices : null,
            ];
        }

        $data['units'] = $shared;
        $data['unit_mode'] = $plan['editable'] ? 'edit' : 'view';

        return $data;
    }

    /**
     * @param  array<string, mixed>  $item
     * @param  list<array{key: string, name: string}>  $choices
     */
    private function chosen(bool $editable, array $item, ?string $card, array $choices): ?string
    {
        if (! $editable) {
            return $card;
        }

        $requested = $item['unit_key'] ?? null;

        return in_array($requested, array_column($choices, 'key'), true)
            ? $requested
            : ($card ?? $this->defaults->unit($choices, (string) ($item['unit'] ?? '')));
    }

    /**
     * @return array{catalog: ?string, editable: bool, owned: bool}
     *
     * @throws OneCException
     */
    private function plan(OneCClient $client, ?string $documentEntity): array
    {
        $schema = $this->schemaIndex->load($client);
        $targets = $this->schemaIndex->unitCatalogs($client);
        $catalog = $targets[self::NOMENCLATURE] ?? null;
        $row = $documentEntity === null ? null : ($targets["{$documentEntity}_Товары_RowType"] ?? null);

        if ($row !== $catalog || $catalog === null) {
            Log::info('documents.units_view_mode', ['card_catalog' => $catalog, 'row_catalog' => $row, 'document' => $documentEntity, 'references' => count($targets)]);
        }

        if ($catalog === null || ! isset($schema[$catalog], $schema[self::NOMENCLATURE][self::CARD_FIELD])) {
            return ['catalog' => null, 'editable' => false, 'owned' => false];
        }

        return ['catalog' => $catalog, 'editable' => $row === $catalog, 'owned' => isset($schema[$catalog][self::OWNER_FIELD])];
    }

    /**
     * @param  array{catalog: ?string, editable: bool, owned: bool}  $plan
     * @param  list<array<string, mixed>>  $items
     * @return array<string, string>
     */
    private function cardUnits(OneCClient $client, array $plan, array $items): array
    {
        $keys = array_values(array_unique(array_filter(array_column($items, 'ref_key'))));

        if ($plan['catalog'] === null || $keys === []) {
            return [];
        }

        $rows = $this->rows($client, self::NOMENCLATURE, $this->anyOf('Ref_Key', $keys), 'Ref_Key,'.self::CARD_FIELD, count($keys));
        $units = [];

        foreach ($rows as $row) {
            $unit = $row[self::CARD_FIELD] ?? null;

            if (isset($row['Ref_Key']) && is_string($unit) && $unit !== '' && ! str_starts_with($unit, '00000000-')) {
                $units[(string) $row['Ref_Key']] = $unit;
            }
        }

        return $units;
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array<string, list<array{key: string, name: string}>>
     */
    private function ownedChoices(OneCClient $client, string $catalog, array $items): array
    {
        $keys = array_values(array_unique(array_filter(array_column($items, 'ref_key'))));
        $grouped = [];

        if ($keys === []) {
            return $grouped;
        }

        $rows = $this->rows($client, $catalog, '('.$this->anyOf(self::OWNER_FIELD, $keys).') and DeletionMark eq false', 'Ref_Key,Description,'.self::OWNER_FIELD, self::CATALOG_LIMIT);

        foreach ($rows as $row) {
            $grouped[(string) ($row[self::OWNER_FIELD] ?? '')][] = ['key' => (string) $row['Ref_Key'], 'name' => (string) ($row['Description'] ?? '')];
        }

        return $grouped;
    }

    /**
     * @return list<array{key: string, name: string}>
     */
    private function catalog(OneCClient $client, ?string $catalog, ?string $filter): array
    {
        if ($catalog === null) {
            return [];
        }

        $rows = $this->rows($client, $catalog, $filter ?? 'DeletionMark eq false', 'Ref_Key,Description', self::CATALOG_LIMIT);

        return array_values(array_map(
            fn (array $row): array => ['key' => (string) $row['Ref_Key'], 'name' => (string) ($row['Description'] ?? '')],
            array_filter($rows, fn (array $row): bool => isset($row['Ref_Key'])),
        ));
    }

    /**
     * @param  array<string, string>  $cards
     * @param  list<array{key: string, name: string}>  $known
     * @return array<string, string>
     */
    private function names(OneCClient $client, ?string $catalog, array $cards, array $known): array
    {
        $names = array_column($known, 'name', 'key');
        $missing = array_values(array_diff(array_unique($cards), array_keys($names)));

        if ($catalog !== null && $missing !== []) {
            foreach ($this->catalog($client, $catalog, $this->anyOf('Ref_Key', $missing)) as $unit) {
                $names[$unit['key']] = $unit['name'];
            }
        }

        return $names;
    }

    /**
     * @param  list<string>  $keys
     */
    private function anyOf(string $field, array $keys): string
    {
        return implode(' or ', array_map(fn (string $key): string => "{$field} eq guid'{$key}'", $keys));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function rows(OneCClient $client, string $entity, string $filter, string $select, int $limit): array
    {
        try {
            return $client->fetchTop($entity, ['$filter' => $filter, '$select' => $select], $limit);
        } catch (OneCRejectedException) {
            return [];
        }
    }
}
