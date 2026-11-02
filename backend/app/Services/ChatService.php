<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\Message;
use InvalidArgumentException;

class ChatService
{
    private const HISTORY_LIMIT = 10;

    private const DEFAULT_TITLE = 'Новый диалог';

    public function __construct(
        private readonly DeepSeekService $deepSeek,
        private readonly OneCToolsService $tools,
    ) {}

    /**
     * Store the user's question, run the AI + 1C pipeline and store the assistant's answer.
     */
    public function ask(Chat $chat, string $question): Message
    {
        $history = $this->history($chat);

        $chat->messages()->create([
            'integration_id' => $chat->integration_id,
            'role' => Message::ROLE_USER,
            'content' => $question,
        ]);

        if ($chat->title === self::DEFAULT_TITLE) {
            $chat->update(['title' => mb_substr($question, 0, 60)]);
        }

        $decision = $this->deepSeek->complete([
            ['role' => 'system', 'content' => $this->dispatcherPrompt($chat)],
            ...$history,
            ['role' => 'user', 'content' => $question],
        ], $this->tools->definitions());

        $widget = null;
        $content = $decision['content'];

        if ($decision['tool_calls'] !== []) {
            [$widget, $content] = $this->answerWithTool($chat, $question, $decision['tool_calls'][0]);
        }

        return $chat->messages()->create([
            'integration_id' => $chat->integration_id,
            'role' => Message::ROLE_ASSISTANT,
            'content' => $content,
            'widget' => $widget,
        ]);
    }

    /**
     * Run the tool the AI picked, then ask the AI to comment on the computed table.
     *
     * @param  array<string, mixed>  $toolCall
     * @return array{0: ?array<string, mixed>, 1: string}
     */
    private function answerWithTool(Chat $chat, string $question, array $toolCall): array
    {
        $name = (string) ($toolCall['function']['name'] ?? '');
        $arguments = json_decode((string) ($toolCall['function']['arguments'] ?? '{}'), true);

        try {
            $widget = $this->tools->execute($chat->integration, $name, is_array($arguments) ? $arguments : []);
        } catch (InvalidArgumentException $exception) {
            return [null, 'Не получилось обработать запрос: '.$exception->getMessage().' Уточните, пожалуйста, вопрос.'];
        }

        $summary = $this->deepSeek->complete([
            ['role' => 'system', 'content' => $this->analystPrompt()],
            ['role' => 'user', 'content' => "Вопрос директора: {$question}\n\nТочные данные из 1С (посчитаны программно):\n"
                .json_encode($widget, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
        ]);

        return [$widget, (string) $summary['content']];
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

    private function dispatcherPrompt(Chat $chat): string
    {
        $today = now()->format('Y-m-d');
        $base = $chat->integration->name;

        return "Ты ассистент директора, подключённый к базе 1С «{$base}». Сегодня {$today}. "
            .'Если вопрос требует данных из 1С, вызови подходящий инструмент, сам вычисляя даты периода '
            .'(например «за октябрь» — с первого по последнее число месяца текущего года). '
            .'Никогда не считай и не выдумывай цифры. Если инструмента для вопроса нет, коротко скажи, что умеешь: '
            .'выручка по организациям и топ покупателей за период.';
    }

    private function analystPrompt(): string
    {
        return 'Ты финансовый директор. Напиши для руководителя краткую сводку на русском: 2–3 маркированных пункта '
            .'с главным, долями, рисками и рекомендацией. Используй только переданные цифры, ничего не пересчитывай и не выдумывай. '
            .'Таблицу повторять не нужно.';
    }
}
