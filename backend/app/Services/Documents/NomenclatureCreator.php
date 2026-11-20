<?php

namespace App\Services\Documents;

use App\Exceptions\DocumentException;
use App\Exceptions\OneCException;
use App\Exceptions\OneCRejectedException;
use App\Services\OneCClient;
use App\Services\OneCSchemaIndex;

class NomenclatureCreator
{
    private const ENTITY = 'Catalog_Номенклатура';

    private const KINDS = 'Catalog_ВидыНоменклатуры';

    private const UNITS = 'Catalog_КлассификаторЕдиницИзмерения';

    private const CATALOG_LIMIT = 200;

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly DocumentResolver $resolver,
        private readonly NomenclatureDefaults $defaults,
    ) {}

    /**
     * Lists to choose from plus a suggestion for every draft item that is missing in the base.
     *
     * @param  array<string, mixed>  $data
     * @return array{kinds: list<array{key: string, name: string}>, units: list<array{key: string, name: string}>, vat_rates: list<array{value: string, label: string}>, items: list<array<string, mixed>>}
     *
     * @throws DocumentException
     */
    public function options(OneCClient $client, array $data): array
    {
        $schema = $this->requireSchema($client);
        $kinds = $this->catalog($client, $schema, self::KINDS);
        $units = $this->unitCatalog($client, $schema);
        $items = [];

        foreach ($data['items'] as $index => $item) {
            if ($item['match'] === 'missing' && $item['name'] !== '') {
                $items[] = [
                    'index' => $index,
                    'name' => $item['name'],
                    'kind_key' => $this->defaults->kind($kinds),
                    'unit_key' => $this->defaults->unit($units, (string) ($item['unit'] ?? '')),
                    'vat_rate' => $this->defaults->vat((string) ($item['vat_rate'] ?? '')),
                ];
            }
        }

        return [
            'kinds' => $kinds,
            'units' => $units,
            'vat_rates' => array_map(
                fn (string $value, string $label): array => ['value' => $value, 'label' => $label],
                array_keys(NomenclatureDefaults::VAT_RATES),
                NomenclatureDefaults::VAT_RATES,
            ),
            'items' => $items,
        ];
    }

    /**
     * Create the chosen missing items in the base; an item that already exists there is never duplicated.
     *
     * @param  array<string, mixed>  $data
     * @param  list<array{index: int, kind_key?: ?string, unit_key?: ?string, vat_rate?: ?string}>  $specs
     *
     * @throws DocumentException
     */
    public function create(OneCClient $client, array $data, array $specs): void
    {
        $fields = $this->requireSchema($client)[self::ENTITY];
        $created = [];

        foreach ($specs as $spec) {
            $item = $data['items'][$spec['index']] ?? null;

            if ($item === null || $item['name'] === '' || isset($created[$item['name']])) {
                continue;
            }

            $created[$item['name']] = true;

            if ($this->resolver->nomenclature($client, $item['name'])['match'] === 'found') {
                continue;
            }

            $client->create(self::ENTITY, $this->payload($item['name'], $spec, $fields));
        }
    }

    /**
     * @param  array<string, mixed>  $spec
     * @param  array<string, string>  $fields
     * @return array<string, mixed>
     */
    private function payload(string $name, array $spec, array $fields): array
    {
        $values = [
            'НаименованиеПолное' => $name,
            'ВидНоменклатуры_Key' => $spec['kind_key'] ?? null,
            'ЕдиницаИзмерения_Key' => $spec['unit_key'] ?? null,
            'СтавкаНДС' => $spec['vat_rate'] ?? null,
        ];

        return ['Description' => $name] + array_filter(
            $values,
            fn (mixed $value, string $field): bool => isset($fields[$field]) && $value !== null,
            ARRAY_FILTER_USE_BOTH,
        );
    }

    /**
     * @return array<string, array<string, string>>
     *
     * @throws DocumentException
     */
    private function requireSchema(OneCClient $client): array
    {
        $schema = $this->schemaIndex->load($client);

        if (! isset($schema[self::ENTITY])) {
            throw new DocumentException('В базе 1С нет справочника номенклатуры.');
        }

        return $schema;
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @return list<array{key: string, name: string}>
     */
    private function unitCatalog(OneCClient $client, array $schema): array
    {
        try {
            $entity = $this->schemaIndex->unitCatalogs($client)[self::ENTITY] ?? self::UNITS;
        } catch (OneCException) {
            $entity = self::UNITS;
        }

        return isset($schema[$entity]['Owner_Key']) ? [] : $this->catalog($client, $schema, $entity);
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     * @return list<array{key: string, name: string}>
     */
    private function catalog(OneCClient $client, array $schema, string $entity): array
    {
        if (! isset($schema[$entity])) {
            return [];
        }

        try {
            $rows = $client->fetchTop($entity, ['$filter' => 'DeletionMark eq false', '$select' => 'Ref_Key,Description'], self::CATALOG_LIMIT);
        } catch (OneCRejectedException) {
            return [];
        }

        return array_values(array_map(
            fn (array $row): array => ['key' => (string) $row['Ref_Key'], 'name' => (string) ($row['Description'] ?? '')],
            array_filter($rows, fn (array $row): bool => isset($row['Ref_Key'])),
        ));
    }
}
