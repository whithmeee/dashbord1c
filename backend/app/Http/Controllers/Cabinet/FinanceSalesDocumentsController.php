<?php

namespace App\Http\Controllers\Cabinet;

use App\Exceptions\OneCException;
use App\Http\Controllers\Controller;
use App\Http\Requests\FinanceSalesDocumentsRequest;
use App\Services\SalesDocumentsService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class FinanceSalesDocumentsController extends Controller
{
    public function __invoke(FinanceSalesDocumentsRequest $request, SalesDocumentsService $documents): JsonResponse
    {
        $integration = $request->user()->ownerCompany()->integrations()->findOrFail($request->integer('integration_id'));
        if (! $integration->is_active) {
            return response()->json([
                'message' => 'Выбранная база 1С отключена. Переключитесь на другую базу.',
                'code' => 'integration_inactive',
            ], 409);
        }

        try {
            $result = $documents->list(
                $integration,
                CarbonImmutable::createFromFormat('Y-m-d', $request->string('from')->toString()),
                CarbonImmutable::createFromFormat('Y-m-d', $request->string('to')->toString()),
                $request->string('currency_key')->toString(),
                $request->string('customer_key')->toString() ?: null,
                $request->string('organization_key')->toString() ?: null,
                $request->integer('page', 1),
                $request->integer('per_page', 20),
            );
        } catch (OneCException $exception) {
            return response()->json(['message' => $exception->getMessage(), 'code' => 'onec_unavailable'], 502);
        }

        return response()->json($result);
    }
}
