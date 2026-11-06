<?php

namespace App\Services;

use App\Exceptions\DeepSeekException;
use App\Models\Chat;
use App\Models\ChatMessageRequest;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;

class DeepSeekService
{
    public function __construct(private readonly DeepSeekUsageRecorder $usageRecorder) {}

    /**
     * Send a chat completion request and return the assistant message.
     *
     * @param  list<array<string, mixed>>  $messages
     * @param  list<array<string, mixed>>  $tools
     * @return array{content: ?string, tool_calls: list<array<string, mixed>>}
     *
     * @throws DeepSeekException
     */
    public function complete(
        array $messages,
        array $tools = [],
        ?Chat $chat = null,
        ?ChatMessageRequest $request = null,
        int $callIndex = 1,
    ): array {
        $payload = [
            'model' => config('services.deepseek.model'),
            'messages' => $messages,
            'temperature' => 0.2,
        ];

        if ($tools !== []) {
            $payload['tools'] = $tools;
        }

        $usage = $chat === null ? null : $this->usageRecorder->begin($chat, $request, $callIndex);
        $usageRecorded = false;

        try {
            $response = Http::withToken((string) config('services.deepseek.api_key'))
                ->timeout((int) config('services.deepseek.timeout'))
                ->post(rtrim((string) config('services.deepseek.base_url'), '/').'/chat/completions', $payload);
            if ($response->failed()) {
                throw new DeepSeekException("DeepSeek ответил ошибкой {$response->status()}.");
            }

            if ($usage !== null) {
                $this->usageRecorder->recordResponse($usage, $response);
                $usageRecorded = true;
            }
            $message = $response->json('choices.0.message');

            if (! is_array($message)) {
                throw new DeepSeekException('DeepSeek вернул пустой ответ.');
            }

            return [
                'content' => $message['content'] ?? null,
                'tool_calls' => $message['tool_calls'] ?? [],
            ];
        } catch (Throwable $exception) {
            if ($usage !== null && ! $usageRecorded) {
                try {
                    $this->usageRecorder->markUnknown($usage);
                } catch (Throwable) {
                }
            }
            if ($exception instanceof ConnectionException) {
                throw new DeepSeekException('Не удалось подключиться к DeepSeek: '.$exception->getMessage(), 0, $exception);
            }
            throw $exception;
        }
    }
}
