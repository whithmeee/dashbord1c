<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Message;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Counts questions asked to the bot (the user's messages), grouped by time and by who/where asked.
 */
class RequestStatisticsService
{
    /**
     * Questions inside the inclusive day range; callers narrow it down by company, author or database.
     *
     * @return Builder<Message>
     */
    public function questions(CarbonImmutable $from, CarbonImmutable $to): Builder
    {
        return Message::query()
            ->join('chats', 'chats.id', '=', 'messages.chat_id')
            ->join('integrations', 'integrations.id', '=', 'messages.integration_id')
            ->where('messages.role', Message::ROLE_USER)
            ->whereBetween('messages.created_at', [$from->startOfDay(), $to->endOfDay()]);
    }

    /**
     * @param  Builder<Message>  $questions
     * @return array<string, mixed>
     */
    public function report(Builder $questions, CarbonImmutable $from, CarbonImmutable $to, string $group): array
    {
        return [
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'group' => $group],
            'total' => (clone $questions)->count(),
            'by_period' => $this->byPeriod($questions, $from, $to, $group),
            'by_integration' => $this->byIntegration($questions),
        ];
    }

    /**
     * @param  Builder<Message>  $questions
     * @return list<array{type: string, id: int, name: ?string, requests: int}>
     */
    public function byAuthor(Builder $questions): array
    {
        $rows = (clone $questions)
            ->selectRaw('chats.author_type, chats.author_id, count(*) as requests')
            ->groupBy('chats.author_type', 'chats.author_id')
            ->orderByDesc('requests')
            ->get();

        $names = [
            (new Company)->getMorphClass() => Company::whereIn('id', $rows->where('author_type', 'company')->pluck('author_id'))->pluck('name', 'id'),
            (new Employee)->getMorphClass() => Employee::whereIn('id', $rows->where('author_type', 'employee')->pluck('author_id'))->pluck('name', 'id'),
        ];

        return $rows->map(fn ($row): array => [
            'type' => $row->author_type,
            'id' => (int) $row->author_id,
            'name' => $names[$row->author_type][$row->author_id] ?? null,
            'requests' => (int) $row->requests,
        ])->all();
    }

    /**
     * @param  Builder<Message>  $questions
     * @return list<array{company_id: int, name: ?string, requests: int}>
     */
    public function byCompany(Builder $questions): array
    {
        $rows = (clone $questions)
            ->selectRaw('integrations.company_id, count(*) as requests')
            ->groupBy('integrations.company_id')
            ->orderByDesc('requests')
            ->get();

        $names = Company::whereIn('id', $rows->pluck('company_id'))->pluck('name', 'id');

        return $rows->map(fn ($row): array => [
            'company_id' => (int) $row->company_id,
            'name' => $names[$row->company_id] ?? null,
            'requests' => (int) $row->requests,
        ])->all();
    }

    /**
     * @param  Builder<Message>  $questions
     * @return list<array{integration_id: int, name: string, requests: int}>
     */
    private function byIntegration(Builder $questions): array
    {
        return (clone $questions)
            ->selectRaw('integrations.id as integration_id, integrations.name, count(*) as requests')
            ->groupBy('integrations.id', 'integrations.name')
            ->orderByDesc('requests')
            ->get()
            ->map(fn ($row): array => [
                'integration_id' => (int) $row->integration_id,
                'name' => (string) $row->name,
                'requests' => (int) $row->requests,
            ])->all();
    }

    /**
     * Every bucket of the range is present, empty ones as zero, so the chart has no gaps.
     *
     * @param  Builder<Message>  $questions
     * @return list<array{period: string, requests: int}>
     */
    private function byPeriod(Builder $questions, CarbonImmutable $from, CarbonImmutable $to, string $group): array
    {
        $buckets = [];

        if ($group === 'hour') {
            for ($moment = $from->startOfDay(); $moment <= $to->endOfDay(); $moment = $moment->addHour()) {
                $buckets[$moment->format('Y-m-d H:00')] = 0;
            }

            (clone $questions)->pluck('messages.created_at')->each(function ($createdAt) use (&$buckets): void {
                $buckets[CarbonImmutable::parse($createdAt)->format('Y-m-d H:00')]++;
            });
        } else {
            for ($day = $from; $day <= $to; $day = $day->addDay()) {
                $buckets[$this->bucketKey($day, $group)] = 0;
            }

            (clone $questions)
                ->select(DB::raw('DATE(messages.created_at) as day'), DB::raw('count(*) as requests'))
                ->groupBy(DB::raw('DATE(messages.created_at)'))
                ->get()
                ->each(function ($row) use (&$buckets, $group): void {
                    $buckets[$this->bucketKey(CarbonImmutable::parse($row->day), $group)] += (int) $row->requests;
                });
        }

        return array_map(
            fn (string $period, int $requests): array => ['period' => $period, 'requests' => $requests],
            array_keys($buckets),
            $buckets,
        );
    }

    /**
     * A week is labelled by its Monday, a month by `YYYY-MM`.
     */
    private function bucketKey(CarbonImmutable $day, string $group): string
    {
        return match ($group) {
            'week' => $day->startOfWeek()->format('Y-m-d'),
            'month' => $day->format('Y-m'),
            default => $day->format('Y-m-d'),
        };
    }
}
