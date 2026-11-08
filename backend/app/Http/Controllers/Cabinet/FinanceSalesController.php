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
                CarbonImmutable::createFromFormat('Y-m-d', $request->string('from')->toString()),
                CarbonImmutable::createFromFormat('Y-m-d', $request->string('to')->toString()),
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
