<?php

namespace App\Services;

use App\Exceptions\OneCException;
use Illuminate\Support\Facades\Cache;
use XMLReader;

class OneCSchemaIndex
{
    /** @var array<int, array<string, array<string, string>>> */
    private array $loaded = [];

    public function __construct(private readonly OneCSchemaPolicy $policy) {}

    /**
     * Allowed entities of the base with their allowed fields: entity => [field => Edm type].
     *
     * @return array<string, array<string, string>>
     *
     * @throws OneCException
     */
    public function load(OneCClient $client): array
    {
        $id = $client->integrationId();

        return $this->loaded[$id] ??= $this->cached($client, "onec:{$id}:schema");
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function cached(OneCClient $client, string $key): array
    {
        $stored = Cache::get($key);
        if (is_string($stored)) {
            return $this->decode($stored);
        }

        return Cache::lock("{$key}:build", 300)->block(240, function () use ($client, $key): array {
            $stored = Cache::get($key);
            if (is_string($stored)) {
                return $this->decode($stored);
            }

            $index = $this->build($client);
            Cache::put($key, $this->encode($index), (int) config('services.onec.schema_cache_ttl'));

            return $index;
        });
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function build(OneCClient $client): array
    {
        $path = tempnam(sys_get_temp_dir(), 'onec-metadata');

        try {
            $client->downloadMetadata($path);
            $index = $this->parse($path);
        } finally {
            @unlink($path);
        }

        if ($index === []) {
            throw new OneCException('1С не отдала описание схемы данных.');
        }

        return $index;
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function parse(string $path): array
    {
        $reader = new XMLReader;
        if (! $reader->open($path, null, LIBXML_NONET | LIBXML_COMPACT)) {
            throw new OneCException('Не удалось прочитать описание схемы 1С.');
        }

        $types = [];
        $sets = [];
        $current = null;

        while ($reader->read()) {
            if ($reader->nodeType !== XMLReader::ELEMENT) {
                continue;
            }

            match ($reader->localName) {
                'EntityType' => $types[$current = (string) $reader->getAttribute('Name')] = [],
                'ComplexType', 'EntityContainer' => $current = null,
                'Property' => $current !== null
                    ? $types[$current][(string) $reader->getAttribute('Name')] = $this->shortType((string) $reader->getAttribute('Type'))
                    : null,
                'EntitySet' => $sets[(string) $reader->getAttribute('Name')] = $this->typeName((string) $reader->getAttribute('EntityType')),
                default => null,
            };
        }
        $reader->close();

        return $this->allowed($types, $sets);
    }

    /**
     * @param  array<string, array<string, string>>  $types
     * @param  array<string, string>  $sets
     * @return array<string, array<string, string>>
     */
    private function allowed(array $types, array $sets): array
    {
        $index = [];

        foreach ($sets as $set => $type) {
            if (! $this->policy->entityAllowed($set) || ! isset($types[$type])) {
                continue;
            }
            $index[$set] = array_filter(
                $types[$type],
                fn (string $kind, string $field): bool => $this->policy->fieldAllowed($field),
                ARRAY_FILTER_USE_BOTH,
            );
        }

        return $index;
    }

    private function typeName(string $qualified): string
    {
        $position = strrpos($qualified, '.');

        return $position === false ? $qualified : substr($qualified, $position + 1);
    }

    private function shortType(string $type): string
    {
        return str_starts_with($type, 'Edm.') ? substr($type, 4) : 'Collection';
    }

    /**
     * @param  array<string, array<string, string>>  $index
     */
    private function encode(array $index): string
    {
        return base64_encode((string) gzencode((string) json_encode($index, JSON_UNESCAPED_UNICODE)));
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function decode(string $stored): array
    {
        $decoded = json_decode((string) gzdecode((string) base64_decode($stored, true)), true);

        return is_array($decoded) ? $decoded : [];
    }
}
