<?php

namespace App\Services;

use InvalidArgumentException;

class OneCSchemaSearch
{
    private const DEFAULT_LIMIT = 6;

    private const MAX_LIMIT = 10;

    private const MAX_FIELDS = 50;

    public function __construct(
        private readonly OneCSchemaIndex $index,
        private readonly OneCSchemaPolicy $policy,
    ) {}

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     *
     * @throws InvalidArgumentException
     */
    public function search(OneCClient $client, array $arguments): array
    {
        $tokens = preg_split('/[\s,;]+/u', mb_strtolower(trim((string) ($arguments['query'] ?? ''))), -1, PREG_SPLIT_NO_EMPTY);
        if ($tokens === []) {
            throw new InvalidArgumentException('Укажите, что искать в схеме 1С.');
        }

        $limit = max(1, min(self::MAX_LIMIT, (int) ($arguments['limit'] ?? self::DEFAULT_LIMIT)));
        $scores = [];

        foreach ($this->index->load($client) as $entity => $fields) {
            $score = $this->score($entity, $fields, $tokens);
            if ($score > 0) {
                $scores[$entity] = $score;
            }
        }

        uksort($scores, fn (string $a, string $b): int => [$scores[$b], mb_strlen($a)] <=> [$scores[$a], mb_strlen($b)]);
        $schema = $this->index->load($client);

        return [
            'entities' => array_map(
                fn (string $entity): array => $this->describe($entity, $schema[$entity], $tokens),
                array_slice(array_keys($scores), 0, $limit),
            ),
        ];
    }

    /**
     * @param  array<string, string>  $fields
     * @param  list<string>  $tokens
     */
    private function score(string $entity, array $fields, array $tokens): int
    {
        $score = 0;
        $name = mb_strtolower($entity);

        foreach ($tokens as $token) {
            $score += str_contains($name, $token) ? 5 : 0;
            $score += min(3, count(array_filter(
                array_keys($fields),
                fn (string $field): bool => str_contains(mb_strtolower($field), $token),
            )));
        }

        return $score;
    }

    /**
     * @param  array<string, string>  $fields
     * @param  list<string>  $tokens
     * @return array<string, mixed>
     */
    private function describe(string $entity, array $fields, array $tokens): array
    {
        $matching = array_filter(
            array_keys($fields),
            fn (string $field): bool => array_filter($tokens, fn (string $token): bool => str_contains(mb_strtolower($field), $token)) !== [],
        );
        $ordered = array_unique([...$matching, ...array_keys($fields)]);

        return [
            'entity' => $entity,
            'kind' => $this->policy->kind($entity),
            'period_field' => isset($fields['Date']) ? 'Date' : (isset($fields['Period']) ? 'Period' : null),
            'fields' => array_map(
                fn (string $field): string => "{$field} ({$fields[$field]})",
                array_slice($ordered, 0, self::MAX_FIELDS),
            ),
        ];
    }
}
