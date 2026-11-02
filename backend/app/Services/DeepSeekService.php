<?php

namespace App\Services;

use App\Exceptions\DeepSeekException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class DeepSeekService
{
    /**
     * Send a chat completion request and return the assistant message.
     *
     * @param  list<array<string, mixed>>  $messages
     * @param  list<array<string, mixed>>  $tools
     * @return array{content: ?string, tool_calls: list<array<string, mixed>>}
     *
     * @throws DeepSeekException
     */
    public function complete(array $messages, array $tools = []): array
    {
        $payload = [
            'model' => config('services.deepseek.model'),
            'messages' => $messages,
            'temperature' => 0.2,
        ];

        if ($tools !== []) {
            $payload['tools'] = $tools;
        }

        try {
            $response = Http::withToken((string) config('services.deepseek.api_key'))
                ->timeout((int) config('services.deepseek.timeout'))
                ->post(rtrim((string) config('services.deepseek.base_url'), '/').'/chat/completions', $payload);
        } catch (ConnectionException $exception) {
            throw new DeepSeekException('Не удалось подключиться к DeepSeek: '.$exception->getMessage(), 0, $exception);
        }

        if ($response->failed()) {
            throw new DeepSeekException("DeepSeek ответил ошибкой {$response->status()}.");
        }

        $message = $response->json('choices.0.message');

        if (! is_array($message)) {
            throw new DeepSeekException('DeepSeek вернул пустой ответ.');
        }

        return [
            'content' => $message['content'] ?? null,
            'tool_calls' => $message['tool_calls'] ?? [],
        ];
    }
}
