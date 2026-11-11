<?php

namespace App\Services;

class OneCSchemaPolicy
{
    private const ENTITY_KINDS = ['Catalog', 'Document', 'AccumulationRegister', 'InformationRegister'];

    private const FORBIDDEN_ENTITY = '/парол|password|секрет|secret|токен|token|пользовател|user|сеанс|session/iu';

    private const FORBIDDEN_FIELD = '/парол|password|секрет|secret|токен|token|паспорт|снилс|телефон|phone|e.?mail|почт|адрес|датарожд|birth|серияномер|пинкод|ключдоступа|apikey/iu';

    private const TECHNICAL_FIELDS = ['DataVersion', 'PredefinedDataName'];

    private const IDENTIFIER = '/^[\p{L}\p{N}_]+$/u';

    public function kind(string $entity): string
    {
        return explode('_', $entity, 2)[0];
    }

    public function entityAllowed(string $entity): bool
    {
        return preg_match(self::IDENTIFIER, $entity) === 1
            && in_array($this->kind($entity), self::ENTITY_KINDS, true)
            && preg_match(self::FORBIDDEN_ENTITY, $entity) !== 1;
    }

    public function fieldAllowed(string $field): bool
    {
        return preg_match(self::IDENTIFIER, $field) === 1
            && ! in_array($field, self::TECHNICAL_FIELDS, true)
            && ! str_ends_with($field, '_Type')
            && preg_match(self::FORBIDDEN_FIELD, $field) !== 1;
    }
}
