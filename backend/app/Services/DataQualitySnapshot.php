<?php

namespace App\Services;

readonly class DataQualitySnapshot
{
    public function __construct(
        public int $integrationId,
        public string $checkedAt,
        public int $checkedObjects,
        public array $capabilities,
        public array $issues,
    ) {}

    public function summary(): array
    {
        $totals = ['critical' => 0, 'warning' => 0, 'info' => 0];
        foreach ($this->issues as $issue) {
            $totals[$issue->severity]++;
        }

        return [
            'integration_id' => $this->integrationId,
            'checked_at' => $this->checkedAt,
            'totals' => $totals + [
                'checked_objects' => $this->checkedObjects,
                'issues' => count($this->issues),
            ],
            'capabilities' => $this->capabilities,
        ];
    }

    public function issueList(?string $severity, ?string $category): array
    {
        $items = array_filter(
            $this->issues,
            fn (DataQualityIssue $issue): bool => ($severity === null || $issue->severity === $severity)
                && ($category === null || $issue->category === $category),
        );

        return [
            'integration_id' => $this->integrationId,
            'checked_at' => $this->checkedAt,
            'items' => array_map(
                fn (DataQualityIssue $issue): array => $issue->toArray(),
                array_values($items),
            ),
        ];
    }
}
