<?php

namespace App\Services;

use App\Models\Integration;
use InvalidArgumentException;

class OneCToolsService
{
    public function __construct(
        private readonly OneCSchemaSearch $schemaSearch,
        private readonly OneCQueryTool $queryTool,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function definitions(): array
    {
        return OneCToolDefinitions::all();
    }

    /**
     * Run a tool by name; `text` goes back to the AI, `widget` (if any) is the table shown to the user.
     *
     * @param  array<string, mixed>  $arguments
     * @return array{text: string, widget: ?array<string, mixed>}
     *
     * @throws InvalidArgumentException
     */
    public function execute(Integration $integration, string $tool, array $arguments): array
    {
        $client = new OneCClient($integration);

        return match ($tool) {
            'search_1c_schema' => [
                'text' => $this->json($this->schemaSearch->search($client, $arguments)),
                'widget' => null,
            ],
            'query_1c' => $this->widgetResult($this->queryTool->query($client, $arguments)),
            default => throw new InvalidArgumentException("Неизвестный инструмент {$tool}."),
        };
    }

    /**
     * @param  array<string, mixed>  $widget
     * @return array{text: string, widget: array<string, mixed>}
     */
    private function widgetResult(array $widget): array
    {
        return ['text' => $this->json($widget), 'widget' => $widget];
    }

    private function json(mixed $value): string
    {
        return (string) json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
