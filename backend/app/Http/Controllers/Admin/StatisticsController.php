<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StatisticsRequest;
use App\Services\RequestStatisticsService;

class StatisticsController extends Controller
{
    /**
     * Questions to the bot across the platform, or for one company with `company_id`.
     *
     * @return array<string, mixed>
     */
    public function __invoke(StatisticsRequest $request, RequestStatisticsService $statistics): array
    {
        [$from, $to] = $request->range();

        $questions = $statistics->questions($from, $to)
            ->when($request->integer('company_id'), fn ($query, int $id) => $query->where('integrations.company_id', $id))
            ->when($request->integer('integration_id'), fn ($query, int $id) => $query->where('messages.integration_id', $id));

        $report = $statistics->report($questions, $from, $to, $request->groupBy());

        if ($request->filled('company_id')) {
            $report['by_author'] = $statistics->byAuthor($questions);
        } else {
            $report['by_company'] = $statistics->byCompany($questions);
        }

        return $report;
    }
}
