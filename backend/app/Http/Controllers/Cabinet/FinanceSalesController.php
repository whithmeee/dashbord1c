<?php

namespace App\Http\Controllers\Cabinet;

use App\Exceptions\OneCException;
use App\Http\Controllers\Controller;
use App\Http\Requests\FinanceSalesRequest;
use App\Services\SalesReportingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class FinanceSalesController extends Controller
{
    public function __invoke(FinanceSalesRequest $request, SalesReportingService $reporting): JsonResponse
    {
        $integration = $request->user()->ownerCompany()->integrations()->findOrFail($request->integer('integration_id'));
        if (! $integration->is_active) {
            return response()->json([
                'message' => 'Выбранная база 1С отключена. Переключитесь на другую базу.',
                'code' => 'integration_inactive',
            ], 409);
        }

        try {
            $report = $reporting->report(
                $integration,
                $request->filled('from')
                    ? CarbonImmutable::createFromFormat('Y-m-d', $request->string('from')->toString())
                    : null,
                $request->filled('to')
                    ? CarbonImmutable::createFromFormat('Y-m-d', $request->string('to')->toString())
                    : null,
                $request->string('currency_key')->toString() ?: null,
                $request->integer('months', 6),
            );
        } catch (OneCException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'code' => 'onec_unavailable',
            ], 502);
        }

        return response()->json($report);
    }
}
