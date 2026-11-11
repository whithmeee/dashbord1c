<?php

namespace App\Services;

class OneCToolDefinitions
{
    /**
     * Tool definitions in the OpenAI-compatible format DeepSeek expects.
     *
     * @return list<array<string, mixed>>
     */
    public static function all(): array
    {
        return [self::searchSchema(), self::query()];
    }

    /**
     * @return array<string, mixed>
     */
    private static function searchSchema(): array
    {
        return self::tool(
            'search_1c_schema',
            'Найти в базе 1С подходящие объекты (справочники, документы, регистры) и их поля по словам: '
            .'«реализация», «контрагент», «номенклатура», «остатки», «задолженность». '
            .'Вызывай перед query_1c, чтобы узнать точные имена объектов и полей. Можно искать несколько раз разными словами.',
            [
                'query' => ['type' => 'string', 'description' => 'Слова для поиска через пробел'],
                'limit' => ['type' => 'integer', 'description' => 'Сколько объектов вернуть, до 10'],
            ],
            ['query'],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private static function query(): array
    {
        return self::tool(
            'query_1c',
            'Безопасно прочитать и посчитать данные 1С (только чтение). Без group_by и metrics вернёт строки объекта, '
            .'с group_by/metrics — сгруппирует и посчитает на стороне сервера. Для документов period обязателен. '
            .'Проведённые и не помеченные на удаление документы отбираются автоматически. '
            .'Суммы по разным валютам считаются раздельно. Ссылки *_Key сервер расшифровывает сам.',
            [
                'entity' => ['type' => 'string', 'description' => 'Точное имя объекта из search_1c_schema'],
                'period' => [
                    'type' => 'object',
                    'description' => 'Период по дате документа или регистра, включительно',
                    'properties' => [
                        'from' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'to' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                    ],
                ],
                'filters' => [
                    'type' => 'object',
                    'description' => 'Поле → значение, либо поле → {"op": eq|ne|gt|ge|lt|le|contains, "value": ...}',
                ],
                'fields' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Поля для режима строк, до 12'],
                'group_by' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Поля группировки, до 3'],
                'metrics' => [
                    'type' => 'array',
                    'description' => 'Метрики, до 5',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'field' => ['type' => 'string', 'description' => 'Числовое поле; для count можно не указывать'],
                            'operation' => ['type' => 'string', 'enum' => ['sum', 'avg', 'min', 'max', 'count']],
                        ],
                        'required' => ['operation'],
                    ],
                ],
                'order_by' => [
                    'type' => 'object',
                    'description' => 'Сортировка: поле группировки, алиас метрики (например sum_СуммаДокумента) или поле строк',
                    'properties' => [
                        'field' => ['type' => 'string'],
                        'direction' => ['type' => 'string', 'enum' => ['asc', 'desc']],
                    ],
                ],
                'limit' => ['type' => 'integer', 'description' => 'Сколько строк показать, до 50, по умолчанию 20'],
                'references' => [
                    'type' => 'object',
                    'description' => 'Необязательно: поле *_Key → справочник Catalog_..., если авторасшифровка не угадала',
                ],
            ],
            ['entity'],
        );
    }

    /**
     * @param  array<string, mixed>  $properties
     * @param  list<string>  $required
     * @return array<string, mixed>
     */
    private static function tool(string $name, string $description, array $properties, array $required): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => $name,
                'description' => $description,
                'parameters' => ['type' => 'object', 'properties' => $properties, 'required' => $required],
            ],
        ];
    }
}
