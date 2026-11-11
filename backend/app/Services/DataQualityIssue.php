<?php

namespace App\Services;

readonly class DataQualityIssue
{
    public function __construct(
        public string $id,
        public string $rule,
        public string $severity,
        public string $category,
        public string $entity,
        public string $objectId,
        public string $title,
        public string $message,
        public array $fields = [],
    ) {}

    public static function fromArray(array $value): self
    {
        return new self(
            (string) $value['id'],
            (string) $value['rule'],
            (string) $value['severity'],
            (string) $value['category'],
            (string) $value['entity'],
            (string) $value['object_id'],
            (string) $value['title'],
            (string) $value['message'],
            is_array($value['fields'] ?? null) ? $value['fields'] : [],
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'rule' => $this->rule,
            'severity' => $this->severity,
            'category' => $this->category,
            'entity' => $this->entity,
            'object_id' => $this->objectId,
            'title' => $this->title,
            'message' => $this->message,
            'fields' => $this->fields,
        ];
    }
}
