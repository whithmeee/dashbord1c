<?php

namespace App\Services;

use XMLReader;

class OneCUnitReferences
{
    private const PROPERTY = 'ЕдиницаИзмерения';

    /**
     * Which type the unit reference of every entity points to: owner type => catalog of units.
     *
     * @return array<string, string>
     */
    public function read(string $path): array
    {
        $reader = new XMLReader;
        if (! @$reader->open($path, null, LIBXML_NONET | LIBXML_COMPACT)) {
            return [];
        }

        $owner = null;
        $references = [];
        $ends = [];
        $association = null;

        while ($reader->read()) {
            if ($reader->nodeType !== XMLReader::ELEMENT) {
                continue;
            }

            match ($reader->localName) {
                'EntityType', 'ComplexType' => $owner = (string) $reader->getAttribute('Name'),
                'EntityContainer' => $owner = $association = null,
                'Association' => $association = (string) $reader->getAttribute('Name'),
                'NavigationProperty' => $this->reference($reader, $owner, $references),
                'End' => $association !== null ? $ends[$association][] = [
                    'role' => (string) $reader->getAttribute('Role'),
                    'type' => $this->typeName((string) $reader->getAttribute('Type')),
                ] : null,
                default => null,
            };
        }
        $reader->close();

        return $this->targets($references, $ends);
    }

    /**
     * @param  array<int, array{owner: string, relationship: string, role: string}>  $references
     */
    private function reference(XMLReader $reader, ?string $owner, array &$references): void
    {
        if ($owner === null || $reader->getAttribute('Name') !== self::PROPERTY) {
            return;
        }

        $references[] = [
            'owner' => $owner,
            'relationship' => $this->typeName((string) $reader->getAttribute('Relationship')),
            'role' => (string) $reader->getAttribute('ToRole'),
        ];
    }

    /**
     * @param  array<int, array{owner: string, relationship: string, role: string}>  $references
     * @param  array<string, list<array{role: string, type: string}>>  $ends
     * @return array<string, string>
     */
    private function targets(array $references, array $ends): array
    {
        $targets = [];

        foreach ($references as $reference) {
            $candidates = $ends[$reference['relationship']] ?? [];
            $byRole = array_values(array_filter($candidates, fn (array $end): bool => $end['role'] === $reference['role']));
            $others = array_values(array_filter($candidates, fn (array $end): bool => $end['type'] !== $reference['owner']));
            $target = ($byRole[0] ?? $others[0] ?? null)['type'] ?? null;

            if ($target !== null) {
                $targets[$reference['owner']] = $target;
            }
        }

        return $targets;
    }

    private function typeName(string $qualified): string
    {
        $position = strrpos($qualified, '.');

        return $position === false ? $qualified : substr($qualified, $position + 1);
    }
}
