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
