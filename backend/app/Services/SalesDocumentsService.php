<?php

namespace App\Services;

use App\Exceptions\OneCException;
use App\Models\Integration;
use Carbon\CarbonImmutable;

class SalesDocumentsService
{
    public function __construct(private readonly OneCSalesReader $reader) {}

    /** @return array<string, mixed> */
    public function list(
        Integration $integration,
        CarbonImmutable $from,
        CarbonImmutable $to,
        string $currencyKey,
        ?string $customerKey,
        ?string $organizationKey,
        int $page,
        int $perPage,
    ): array {
        $client = new OneCClient($integration);
        $documents = array_values(array_filter(
            $this->reader->documents($client, $from, $to),
            fn (array $item): bool => $this->matches($item, $currencyKey, $customerKey, $organizationKey),
        ));
        usort($documents, fn (array $left, array $right): int => strcmp((string) $right['Date'], (string) $left['Date']));
        $customers = $client->catalogNames('Catalog_Контрагенты');
        $organizations = $client->catalogNames('Catalog_Организации');
        $total = count($documents);
        $items = array_slice($documents, ($page - 1) * $perPage, $perPage);

        return [
            'items' => array_map(fn (array $item): array => $this->map($item, $customers, $organizations), $items),
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ];
    }

    /** @param array<string, mixed> $item */
    private function matches(array $item, string $currency, ?string $customer, ?string $organization): bool
    {
        return (string) ($item['ВалютаДокумента_Key'] ?? '') === $currency
            && ($customer === null || (string) ($item['Контрагент_Key'] ?? '') === $customer)
            && ($organization === null || (string) ($item['Организация_Key'] ?? '') === $organization);
    }

    /** @param array<string, mixed> $item @param array<string, string> $customers @param array<string, string> $organizations */
    private function map(array $item, array $customers, array $organizations): array
    {
        $customer = (string) ($item['Контрагент_Key'] ?? '');
        $organization = (string) ($item['Организация_Key'] ?? '');
        $amount = str_replace(',', '.', trim((string) ($item['СуммаДокумента'] ?? '')));
        if (! preg_match('/^-?\d+(?:\.\d+)?$/', $amount)) {
            throw new OneCException('1С вернула реализацию с некорректной суммой.');
        }

        return [
            'id' => (string) $item['Ref_Key'],
            'date' => (string) $item['Date'],
            'amount' => $amount,
            'currency_key' => (string) $item['ВалютаДокумента_Key'],
            'customer' => ['key' => $customer, 'name' => $customers[$customer] ?? 'Неизвестно'],
            'organization' => ['key' => $organization, 'name' => $organizations[$organization] ?? 'Неизвестно'],
        ];
    }
}
