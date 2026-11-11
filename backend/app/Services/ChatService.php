<?php

namespace App\Services;

use App\Exceptions\OneCRejectedException;
use App\Models\Chat;
use App\Models\ChatMessageRequest;
use App\Models\Message;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ChatService
{
    private const HISTORY_LIMIT = 10;

    private const MAX_ROUNDS = 6;

    private const TOOL_RESULT_LIMIT = 12000;

    private const DEFAULT_TITLE = 'Новый диалог';

    private const EMPTY_ANSWER = 'Не удалось сформировать ответ. Переформулируйте вопрос.';

    public function __construct(
        private readonly DeepSeekService $deepSeek,
        private readonly OneCToolsService $tools,
        private readonly ChatPrompts $prompts,
    ) {}

    /**
     * Store the user's question, run the AI + 1C pipeline and store the assistant's answer.
     */
    public function ask(Chat $chat, string $question, ?ChatMessageRequest $request = null): Message
    {
        $history = $this->history($chat);

        $userMessage = $request?->userMessage;
        if ($userMessage === null) {
            $userMessage = $chat->messages()->create([
                'integration_id' => $chat->integration_id,
                'role' => Message::ROLE_USER,
                'content' => $question,
            ]);
        }

        if ($chat->title === self::DEFAULT_TITLE) {
            $chat->update(['title' => mb_substr($question, 0, 60)]);
        }

        [$content, $widget] = $this->converse($chat, $question, $history, $request);

        return DB::transaction(function () use ($chat, $content, $widget, $request): Message {
            $assistant = $chat->messages()->create([
                'integration_id' => $chat->integration_id,
                'role' => Message::ROLE_ASSISTANT,
                'content' => $content,
                'widget' => $widget,
            ]);

            $request?->update([
                'assistant_message_id' => $assistant->id,
                'status' => ChatMessageRequest::COMPLETED,
                'completed_at' => now(),
            ]);

            return $assistant;
        });
    }

    /**
     * Let the AI call 1C tools until it has enough data to answer; the last table it read is shown to the user.
     *
     * @param  list<array{role: string, content: string}>  $history
     * @return array{0: string, 1: ?array<string, mixed>}
     */
    private function converse(Chat $chat, string $question, array $history, ?ChatMessageRequest $request): array
    {
        $messages = [
            ['role' => 'system', 'content' => $this->prompts->assistant($chat->integration)],
            ...$history,
            ['role' => 'user', 'content' => $question],
        ];
        $widget = null;

        for ($round = 1; $round <= self::MAX_ROUNDS; $round++) {
            $tools = $round < self::MAX_ROUNDS ? $this->tools->definitions() : [];
            $step = $this->deepSeek->complete($messages, $tools, $chat, $request, $round);

            if ($step['tool_calls'] === []) {
                return [(string) ($step['content'] ?? self::EMPTY_ANSWER), $widget];
            }

            $messages[] = ['role' => 'assistant', 'content' => $step['content'], 'tool_calls' => $step['tool_calls']];

            foreach ($step['tool_calls'] as $index => $toolCall) {
                $result = $this->runTool($chat, $toolCall);
                $widget = $result['widget'] ?? $widget;
                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => (string) ($toolCall['id'] ?? "call_{$round}_{$index}"),
                    'content' => mb_substr($result['text'], 0, self::TOOL_RESULT_LIMIT),
                ];
            }
        }

        return [self::EMPTY_ANSWER, $widget];
    }

    /**
     * A tool mistake or a refusal from 1C goes back to the AI so it can correct the call.
     *
     * @param  array<string, mixed>  $toolCall
     * @return array{text: string, widget: ?array<string, mixed>}
     */
    private function runTool(Chat $chat, array $toolCall): array
    {
        $name = (string) ($toolCall['function']['name'] ?? '');
        $arguments = json_decode((string) ($toolCall['function']['arguments'] ?? '{}'), true);

        try {
            return $this->tools->execute($chat->integration, $name, is_array($arguments) ? $arguments : []);
        } catch (InvalidArgumentException $exception) {
            return ['text' => 'Ошибка вызова: '.$exception->getMessage(), 'widget' => null];
        } catch (OneCRejectedException $exception) {
            return ['text' => '1С отклонила запрос: '.$exception->getMessage().' Проверь имя объекта и условия отбора.', 'widget' => null];
        }
    }

    /**
     * Only the exchange with the currently selected database, so answers about another one never leak in.
     *
     * @return list<array{role: string, content: string}>
     */
    private function history(Chat $chat): array
    {
        return $chat->messages()
            ->where(fn ($query) => $query->where('integration_id', $chat->integration_id)->orWhereNull('integration_id'))
            ->whereNotNull('content')
            ->latest('id')
            ->limit(self::HISTORY_LIMIT)
            ->get()
            ->reverse()
            ->map(fn (Message $message): array => ['role' => $message->role, 'content' => $message->content])
            ->values()
            ->all();
    }
}
