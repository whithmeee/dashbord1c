<?php

namespace App\Services;

use App\Exceptions\DataQualityException;
use App\Models\Integration;
use Illuminate\Support\Facades\Log;

class CounterpartyTaxDetailsUpdater
{
    private const ENTITY = 'Catalog_Контрагенты';

    private const LEGAL_TYPE_FIELD = 'ЮридическоеФизическоеЛицо';

    private const LEGAL_TYPES = [
        'legal' => 'ЮридическоеЛицо',
        'individual' => 'ИндивидуальныйПредприниматель',
    ];

    public function __construct(
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly DataQualityService $quality,
    ) {}

    /**
     * Write a corrected INN, KPP or legal type into the counterparty card of the customer's base.
     *
     * @param  array{inn?: ?string, kpp?: ?string, legal_type?: ?string}  $change
     *
     * @throws DataQualityException
     */
    public function update(Integration $integration, string $refKey, array $change): void
    {
        $client = new OneCClient($integration);
        $fields = $this->schemaIndex->load($client)[self::ENTITY] ?? [];
        $current = $this->current($client, $refKey);
        $payload = $this->payload($change, $fields);
        $inn = (string) ($payload['ИНН'] ?? $current['ИНН'] ?? '');
        $kpp = (string) ($payload['КПП'] ?? $current['КПП'] ?? '');

        if (isset($payload['ИНН']) || isset($payload['КПП'])) {
            $this->assertNoTwin($client, $refKey, $inn, $kpp);
        }

        $client->update(self::ENTITY, $refKey, $payload);
        $this->quality->forget($integration);
        Log::info('data-quality.counterparty_updated', [
            'integration_id' => $integration->id,
            'counterparty' => $refKey,
            'fields' => array_keys($payload),
        ]);
    }

    /**
     * @return array<string, mixed>
     *
     * @throws DataQualityException
     */
    private function current(OneCClient $client, string $refKey): array
    {
        $rows = $client->fetchTop(self::ENTITY, ['$filter' => "Ref_Key eq guid'{$refKey}'"], 1);

        if ($rows === []) {
            throw new DataQualityException('Контрагент не найден в 1С: возможно, его удалили.');
        }

        return $rows[0];
    }

    /**
     * @param  array{inn?: ?string, kpp?: ?string, legal_type?: ?string}  $change
     * @param  array<string, string>  $fields
     * @return array<string, string>
     *
     * @throws DataQualityException
     */
    private function payload(array $change, array $fields): array
    {
        $values = [
            'ИНН' => $change['inn'] ?? null,
            'КПП' => $change['kpp'] ?? null,
            self::LEGAL_TYPE_FIELD => isset($change['legal_type']) ? self::LEGAL_TYPES[$change['legal_type']] : null,
        ];
        $payload = array_filter($values, fn (?string $value, string $field): bool => $value !== null && isset($fields[$field]), ARRAY_FILTER_USE_BOTH);

        if ($payload === []) {
            throw new DataQualityException('В карточке контрагента в этой базе нет полей, которые можно изменить.');
        }

        return $payload;
    }

    /**
     * @throws DataQualityException
     */
    private function assertNoTwin(OneCClient $client, string $refKey, string $inn, string $kpp): void
    {
        $filter = "ИНН eq '{$inn}' and КПП eq '{$kpp}' and DeletionMark eq false and Ref_Key ne guid'{$refKey}'";
        $twins = $client->fetchTop(self::ENTITY, ['$filter' => $filter, '$select' => 'Ref_Key,Description'], 1);

        if ($twins !== []) {
            throw new DataQualityException("Контрагент с таким ИНН и КПП уже есть в 1С: «{$twins[0]['Description']}».");
        }
    }
}
