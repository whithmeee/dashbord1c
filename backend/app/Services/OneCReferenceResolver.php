<?php

namespace App\Services;

use App\Exceptions\OneCRejectedException;

class OneCReferenceResolver
{
    /**
     * Names for the *_Key columns: column => [guid => name]. Columns whose catalog cannot be found stay as GUIDs.
     *
     * @param  list<string>  $columns
     * @param  array<string, string>  $overrides
     * @param  array<string, array<string, string>>  $schema
     * @return array<string, array<string, string>>
     */
    public function names(OneCClient $client, array $columns, array $overrides, array $schema): array
    {
        $names = [];

        foreach ($columns as $column) {
            $catalog = $overrides[$column] ?? $this->catalogFor($column, $schema);
            if ($catalog === null) {
                continue;
            }

            try {
                $names[$column] = $client->catalogNames($catalog);
            } catch (OneCRejectedException) {
                continue;
            }
        }

        return $names;
    }

    /**
     * @param  array<string, array<string, string>>  $schema
     */
    private function catalogFor(string $column, array $schema): ?string
    {
        if ($column === 'Ref_Key' || ! str_ends_with($column, '_Key')) {
            return null;
        }

        $base = substr($column, 0, -4);
        $catalogs = array_filter(array_keys($schema), fn (string $entity): bool => str_starts_with($entity, 'Catalog_'));

        foreach ([$base, $this->firstWord($base)] as $stem) {
            $catalog = $this->match($stem, $catalogs);
            if ($catalog !== null) {
                return $catalog;
            }
        }

        return null;
    }

    private function firstWord(string $name): string
    {
        return preg_match('/^\p{Lu}\p{Ll}+/u', $name, $match) === 1 ? $match[0] : $name;
    }

    /**
     * @param  array<int, string>  $catalogs
     */
    private function match(string $stem, array $catalogs): ?string
    {
        if (mb_strlen($stem) < 4) {
            return null;
        }

        $prefix = mb_strtolower(mb_substr($stem, 0, max(4, mb_strlen($stem) - 2)));
        $found = array_filter(
            $catalogs,
            fn (string $catalog): bool => str_starts_with(mb_strtolower(substr($catalog, 8)), $prefix),
        );
        usort($found, fn (string $a, string $b): int => mb_strlen($a) <=> mb_strlen($b));

        return $found[0] ?? null;
    }
}
