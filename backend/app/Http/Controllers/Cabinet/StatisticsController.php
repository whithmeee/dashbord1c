<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use App\Http\Requests\StatisticsRequest;
use App\Models\Company;
use App\Services\RequestStatisticsService;

class StatisticsController extends Controller
{
    /**
     * Questions to the bot over a period. The owner sees the whole company (plus a per-author split),
     * an employee only their own.
     *
     * @return array<string, mixed>
     */
    public function __invoke(StatisticsRequest $request, RequestStatisticsService $statistics): array
    {
        $account = $request->user();
        [$from, $to] = $request->range();

        $questions = $statistics->questions($from, $to)
            ->where('integrations.company_id', $account->ownerCompany()->id)
            ->when($request->integer('integration_id'), fn ($query, int $id) => $query->where('messages.integration_id', $id));

        if (! $account instanceof Company) {
            $questions->where('chats.author_type', $account->getMorphClass())->where('chats.author_id', $account->id);
        }

        $report = $statistics->report($questions, $from, $to, $request->groupBy());

        if ($account instanceof Company) {
            $report['by_author'] = $statistics->byAuthor($questions);
        }

        return $report;
    }
}
