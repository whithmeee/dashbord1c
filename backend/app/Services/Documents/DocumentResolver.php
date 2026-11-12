<?php

namespace App\Services\Documents;

use App\Exceptions\OneCRejectedException;
use App\Services\OneCClient;

class DocumentResolver
{
    private const EMPTY_REF = '00000000-0000-0000-0000-000000000000';

    /**
     * Link every party, item and the contract of the draft to records of the customer's 1C base.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function resolve(OneCClient $client, array $data): array
    {
        $data['counterparty'] = $this->counterparty($client, $data['counterparty']);
        $data['buyer'] = $this->organization($client, $data['buyer']);
        $data['contract'] = $this->contract($client, $data['counterparty'], $data['buyer']);
        $names = [];

        foreach ($data['items'] as $index => $item) {
            $names[$item['name']] ??= $this->nomenclature($client, $item['name']);
            $data['items'][$index] = array_merge($item, $names[$item['name']]);
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $party
     * @return array<string, mixed>
     */
    private function counterparty(OneCClient $client, array $party): array
    {
        $found = $party['inn'] !== ''
            ? $this->rows($client, 'Catalog_Контрагенты', "ИНН eq {$this->literal($party['inn'])} and DeletionMark eq false")
            : [];

        if (count($found) > 1 && $party['kpp'] !== '') {
            $found = $this->rows($client, 'Catalog_Контрагенты', "ИНН eq {$this->literal($party['inn'])} and КПП eq {$this->literal($party['kpp'])} and DeletionMark eq false") ?: $found;
        }

        if ($found !== []) {
            return $this->link($party, $found[0], count($found) === 1 ? 'found' : 'matched');
        }

        $byName = $party['name'] !== ''
            ? $this->rows($client, 'Catalog_Контрагенты', "Description eq {$this->literal($party['name'])} and DeletionMark eq false")
            : [];

        return $byName === [] ? $this->unlink($party) : $this->link($party, $byName[0], 'matched');
    }

    /**
     * @param  array<string, mixed>  $party
     * @return array<string, mixed>
     */
    private function organization(OneCClient $client, array $party): array
    {
        $found = $party['inn'] !== ''
            ? $this->rows($client, 'Catalog_Организации', "ИНН eq {$this->literal($party['inn'])} and DeletionMark eq false")
            : [];

        if ($found !== []) {
            return $this->link($party, $found[0], 'found');
        }

        $all = $this->rows($client, 'Catalog_Организации', 'DeletionMark eq false');

        return count($all) === 1 ? $this->link($party, $all[0], 'matched') : $this->unlink($party);
    }

    /**
     * @param  array<string, mixed>  $counterparty
     * @param  array<string, mixed>  $buyer
     * @return array{ref_key: ?string, match: string}
     */
    private function contract(OneCClient $client, array $counterparty, array $buyer): array
    {
        if ($counterparty['ref_key'] === null || $buyer['ref_key'] === null) {
            return ['ref_key' => null, 'match' => 'missing'];
        }

        $rows = $this->rows(
            $client,
            'Catalog_ДоговорыКонтрагентов',
            "Owner_Key eq guid'{$counterparty['ref_key']}' and Организация_Key eq guid'{$buyer['ref_key']}' and DeletionMark eq false",
        );

        return $rows === []
            ? ['ref_key' => null, 'match' => 'missing']
            : ['ref_key' => $rows[0]['Ref_Key'], 'match' => count($rows) === 1 ? 'found' : 'matched'];
    }

    /**
     * @return array{ref_key: ?string, match: string}
     */
    private function nomenclature(OneCClient $client, string $name): array
    {
        if ($name === '') {
            return ['ref_key' => null, 'match' => 'missing'];
        }

        $exact = $this->rows($client, 'Catalog_Номенклатура', "Description eq {$this->literal($name)} and DeletionMark eq false");

        if ($exact !== []) {
            return ['ref_key' => $exact[0]['Ref_Key'], 'match' => 'found'];
        }

        $similar = $this->rows($client, 'Catalog_Номенклатура', "substringof({$this->literal($name)},Description) eq true and DeletionMark eq false");

        return count($similar) === 1
            ? ['ref_key' => $similar[0]['Ref_Key'], 'match' => 'matched']
            : ['ref_key' => null, 'match' => 'missing'];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function rows(OneCClient $client, string $entity, string $filter): array
    {
        try {
            $rows = $client->fetchTop($entity, ['$filter' => $filter, '$select' => 'Ref_Key,Description'], 2);
        } catch (OneCRejectedException) {
            return [];
        }

        return array_values(array_filter($rows, fn (array $row): bool => ($row['Ref_Key'] ?? self::EMPTY_REF) !== self::EMPTY_REF));
    }

    private function literal(string $value): string
    {
        return "'".str_replace("'", "''", $value)."'";
    }

    /**
     * @param  array<string, mixed>  $party
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function link(array $party, array $row, string $match): array
    {
        return ['ref_key' => $row['Ref_Key'], 'match' => $match, 'catalog_name' => (string) ($row['Description'] ?? '')] + $party;
    }

    /**
     * @param  array<string, mixed>  $party
     * @return array<string, mixed>
     */
    private function unlink(array $party): array
    {
        return ['ref_key' => null, 'match' => 'missing'] + $party;
    }
}
