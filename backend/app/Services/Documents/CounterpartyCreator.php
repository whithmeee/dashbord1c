<?php

namespace App\Services\Documents;

use App\Exceptions\DocumentException;
use App\Services\OneCClient;
use App\Services\OneCSchemaIndex;

class CounterpartyCreator
{
    private const ENTITY = 'Catalog_Контрагенты';

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly DocumentResolver $resolver,
    ) {}

    /**
     * Create the supplier of the draft in the base unless a record for it is already there.
     *
     * @param  array<string, mixed>  $party
     *
     * @throws DocumentException
     */
    public function create(OneCClient $client, array $party): void
    {
        if ($party['name'] === '' || ! in_array(strlen($party['inn']), [10, 12], true)) {
            throw new DocumentException('Чтобы создать контрагента, нужны название и ИНН из 10 или 12 цифр.');
        }

        $schema = $this->schemaIndex->load($client);

        if (! isset($schema[self::ENTITY])) {
            throw new DocumentException('В базе 1С нет справочника контрагентов.');
        }

        if ($this->resolver->counterparty($client, $party)['match'] !== 'missing') {
            return;
        }

        $client->create(self::ENTITY, $this->payload($party, $schema[self::ENTITY]));
    }

    /**
     * @param  array<string, mixed>  $party
     * @param  array<string, string>  $fields
     * @return array<string, mixed>
     */
    private function payload(array $party, array $fields): array
    {
        $values = [
            'НаименованиеПолное' => $party['name'],
            'ИНН' => $party['inn'],
            'КПП' => $party['kpp'] !== '' ? $party['kpp'] : null,
            'ЮридическоеФизическоеЛицо' => strlen($party['inn']) === 10 ? 'ЮридическоеЛицо' : 'ИндивидуальныйПредприниматель',
        ];

        return ['Description' => $party['name']] + array_filter(
            $values,
            fn (mixed $value, string $field): bool => isset($fields[$field]) && $value !== null,
            ARRAY_FILTER_USE_BOTH,
        );
    }
}
