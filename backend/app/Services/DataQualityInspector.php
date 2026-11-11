<?php

namespace App\Services;

use App\Models\Integration;

class DataQualityInspector
{
    private const COUNTERPARTIES = 'Catalog_Контрагенты';

    private const CONTRACTS = 'Catalog_ДоговорыКонтрагентов';

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly DataQualityRules $rules,
    ) {}

    public function inspect(Integration $integration): DataQualitySnapshot
    {
        $client = new OneCClient($integration);
        $schema = $this->schemaIndex->load($client);
        $counterpartyFields = $schema[self::COUNTERPARTIES] ?? [];
        $contractFields = $schema[self::CONTRACTS] ?? [];
        $capabilities = $this->capabilities($counterpartyFields, $contractFields);
        $counterparties = $this->counterparties($client, $counterpartyFields);
        $contracts = $this->contracts($client, $contractFields, $capabilities['contracts']);
        $owners = [];

        foreach ($contracts as $contract) {
            if (! ($contract['DeletionMark'] ?? false) && ($contract['Owner_Key'] ?? '') !== '') {
                $owners[(string) $contract['Owner_Key']] = true;
            }
        }

        return new DataQualitySnapshot(
            $integration->id,
            now()->toISOString(),
            count($counterparties) + count($contracts),
            $capabilities,
            $this->rules->inspect($counterparties, $owners, $capabilities),
        );
    }

    private function counterparties(OneCClient $client, array $fields): array
    {
        if ($fields === []) {
            return [];
        }

        return $client->fetchAll(self::COUNTERPARTIES, [
            '$select' => implode(',', $this->availableFields([
                'Ref_Key', 'Description', 'DeletionMark', 'IsFolder', 'ЮридическоеФизическоеЛицо', 'ИНН', 'КПП', 'ИННВведенКорректно', 'КППВведенКорректно',
            ], $fields)),
        ]);
    }

    private function contracts(OneCClient $client, array $fields, bool $supported): array
    {
        if (! $supported) {
            return [];
        }

        return $client->fetchAll(self::CONTRACTS, [
            '$select' => implode(',', $this->availableFields(['Ref_Key', 'Description', 'Owner_Key', 'DeletionMark'], $fields)),
        ]);
    }

    private function availableFields(array $wanted, array $available): array
    {
        return array_values(array_filter($wanted, fn (string $field): bool => isset($available[$field])));
    }

    private function capabilities(array $counterparty, array $contract): array
    {
        return [
            'tax_details' => isset($counterparty['ИНН'], $counterparty['КПП']),
            'inn_validation' => isset($counterparty['ИННВведенКорректно']),
            'kpp_validation' => isset($counterparty['КППВведенКорректно']),
            'legal_type' => isset($counterparty['ЮридическоеФизическоеЛицо']),
            'contracts' => isset($contract['Owner_Key'], $contract['DeletionMark']),
        ];
    }
}
