<?php

namespace App\Services\Documents;

interface ConfigurationProfile
{
    public function key(): string;

    public function label(): string;

    /**
     * @param  array<string, array<string, string>>  $schema
     */
    public function supports(array $schema): bool;

    /**
     * @param  array<string, array<string, string>>  $schema
     */
    public function entity(string $type, array $schema): ?string;

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, string>  $fields
     * @param  array<string, string|null>  $refs
     * @return array<string, mixed>
     */
    public function payload(string $type, array $data, array $fields, array $refs): array;
}
