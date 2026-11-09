<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeActivity;
use App\Models\Message;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class EmployeeActivityService
{
    private const QUESTION_PREVIEW_LENGTH = 200;

    public function record(Employee $employee, string $type): void
    {
        $employee->activities()->create(['type' => $type, 'occurred_at' => now()]);
    }

    /**
     * @return array<string, mixed>
     */
    public function profile(Employee $employee, int $limit): array
    {
        $questions = $this->questions($employee);

        return [
            'last_login_at' => $this->lastOf($employee, EmployeeActivity::LOGIN),
            'last_logout_at' => $this->lastOf($employee, EmployeeActivity::LOGOUT),
            'questions_count' => (clone $questions)->count(),
            'items' => $this->recentItems($employee, $questions, $limit),
        ];
    }

    private function lastOf(Employee $employee, string $type): mixed
    {
        $latest = $employee->activities()->where('type', $type)->max('occurred_at');

        return $latest === null ? null : CarbonImmutable::parse($latest);
    }

    private function questions(Employee $employee): Builder
    {
        return Message::query()
            ->join('chats', 'chats.id', '=', 'messages.chat_id')
            ->where('chats.author_type', $employee->getMorphClass())
            ->where('chats.author_id', $employee->id)
            ->where('messages.role', Message::ROLE_USER);
    }

    /**
     * @return array<int, array{type: string, at: mixed, details: ?string}>
     */
    private function recentItems(Employee $employee, Builder $questions, int $limit): array
    {
        $events = $employee->activities()->latest('occurred_at')->limit($limit)->get()
            ->map(fn (EmployeeActivity $activity) => [
                'type' => $activity->type,
                'at' => $activity->occurred_at,
                'details' => null,
            ]);

        $asked = $questions->latest('messages.created_at')->limit($limit)->get(['messages.content', 'messages.created_at'])
            ->map(fn (Message $message) => [
                'type' => 'question',
                'at' => $message->created_at,
                'details' => mb_substr((string) $message->content, 0, self::QUESTION_PREVIEW_LENGTH),
            ]);

        return $events->concat($asked)->sortByDesc('at')->take($limit)->values()->all();
    }
}
