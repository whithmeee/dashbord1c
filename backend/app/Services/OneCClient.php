<?php

namespace App\Services;

use App\Exceptions\OneCException;
use App\Exceptions\OneCRejectedException;
use App\Models\Integration;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Read-only OData client for a single customer's 1C database.
 */
class OneCClient
{
    private const MAX_PAGES = 50;

    private const EMPTY_REF = '00000000-0000-0000-0000-000000000000';

    public function __construct(private readonly Integration $integration) {}

    /**
     * Fetch every row of an OData entity, following $top/$skip pagination.
     *
     * @param  array<string, string>  $query  OData options such as $filter and $select
     * @return list<array<string, mixed>>
     *
     * @throws OneCException
     */
    public function fetchAll(string $entity, array $query = [], int $maxPages = self::MAX_PAGES): array
    {
        $pageSize = (int) config('services.onec.page_size');
        $rows = [];

        for ($page = 0; $page < $maxPages; $page++) {
            $chunk = $this->fetchPage($entity, $query + [
                '$top' => $pageSize,
                '$skip' => $page * $pageSize,
            ]);

            array_push($rows, ...$chunk);

            if (count($chunk) < $pageSize) {
                return $rows;
            }
        }

        throw new OneCRejectedException("1С вернула слишком много записей для {$entity}, сузьте период или добавьте отбор.");
    }

    public function integrationId(): int
    {
        return $this->integration->id;
    }

    /**
     * @throws OneCException
     */
    public function downloadMetadata(string $path): void
    {
        $url = rtrim($this->integration->odata_url, '/').'/$metadata';

        try {
            $response = $this->request()
                ->accept('application/xml')
                ->timeout((int) config('services.onec.metadata_timeout'))
                ->withOptions(['sink' => $path])
                ->get($url);
        } catch (ConnectionException $exception) {
            throw new OneCException('Не удалось подключиться к 1С: '.$exception->getMessage(), 0, $exception);
        }

        if ($response->failed()) {
            throw new OneCException("1С ответила ошибкой {$response->status()} на запрос описания схемы.");
        }
    }

    /**
     * Fetch the first row for an explicitly ordered OData query.
     *
     * @param  array<string, string>  $query
     * @return array<string, mixed>|null
     */
    public function fetchOne(string $entity, array $query = []): ?array
    {
        return $this->fetchPage($entity, $query + ['$top' => 1, '$skip' => 0])[0] ?? null;
    }

    /**
     * Map of Ref_Key => Description for a catalog, cached between requests.
     *
     * @return array<string, string>
     */
    public function catalogNames(string $catalog): array
    {
        $cacheKey = "onec:{$this->integration->id}:catalog:{$catalog}";

        return Cache::remember(
            $cacheKey,
            (int) config('services.onec.reference_cache_ttl'),
            function () use ($catalog): array {
                $names = [];

                foreach ($this->fetchAll($catalog, ['$select' => 'Ref_Key,Description']) as $row) {
                    $names[$row['Ref_Key']] = (string) ($row['Description'] ?? '');
                }

                return $names;
            },
        );
    }

    /**
     * Resolve a 1C reference key into a human readable name.
     *
     * @param  array<string, string>  $names
     */
    public function resolveName(array $names, ?string $key): string
    {
        if ($key === null || $key === self::EMPTY_REF) {
            return 'Не указан';
        }

        return $names[$key] ?? 'Неизвестно';
    }

    public static function pingUrl(Integration $integration): string
    {
        return rtrim($integration->odata_url, '/').'/?$format=json';
    }

    /**
     * Cheap reachability check: the OData service document answers without scanning any catalog.
     */
    public function isReachable(): bool
    {
        try {
            return $this->request()->get(self::pingUrl($this->integration))->successful();
        } catch (ConnectionException) {
            return false;
        }
    }

    /**
     * @param  array<string, string|int>  $query
     * @return list<array<string, mixed>>
     *
     * @throws OneCException
     */
    private function fetchPage(string $entity, array $query): array
    {
        $url = rtrim($this->integration->odata_url, '/').'/'.rawurlencode($entity)
            .'?'.http_build_query($query + ['$format' => 'json'], '', '&', PHP_QUERY_RFC3986);

        try {
            $response = $this->request()->get($url);
        } catch (ConnectionException $exception) {
            throw new OneCException('Не удалось подключиться к 1С: '.$exception->getMessage(), 0, $exception);
        }

        if ($response->failed()) {
            $message = "1С ответила ошибкой {$response->status()} на запрос {$entity}.";

            throw in_array($response->status(), [400, 404], true)
                ? new OneCRejectedException($message)
                : new OneCException($message);
        }

        return $response->json('value') ?? [];
    }

    /**
     * @param  array<string, string>  $query
     * @return list<array<string, mixed>>
     *
     * @throws OneCException
     */
    public function fetchTop(string $entity, array $query, int $top): array
    {
        return $this->fetchPage($entity, $query + ['$top' => $top]);
    }

    /**
     * Create a document or catalog item and return the stored row.
     *
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     *
     * @throws OneCException
     */
    public function create(string $entity, array $body): array
    {
        $url = rtrim($this->integration->odata_url, '/').'/'.rawurlencode($entity).'?$format=json';

        try {
            $response = $this->request()->asJson()->post($url, $body);
        } catch (ConnectionException $exception) {
            throw new OneCException('Не удалось подключиться к 1С: '.$exception->getMessage(), 0, $exception);
        }

        if ($response->failed()) {
            $reason = (string) ($response->json('odata.error.message.value') ?? $response->json('error.message.value') ?? $response->status());

            throw $response->status() < 500 && $response->status() !== 401 && $response->status() !== 403
                ? new OneCRejectedException("1С отклонила запись: {$reason}")
                : new OneCException("1С ответила ошибкой {$response->status()} при записи {$entity}.");
        }

        return (array) $response->json();
    }

    private function request(): PendingRequest
    {
        return Http::withBasicAuth($this->integration->login, $this->integration->password)
            ->acceptJson()
            ->timeout((int) config('services.onec.timeout'));
    }
}
