<?php

namespace App\Http\Controllers\Cabinet;

use App\Exceptions\OneCException;
use App\Http\Controllers\Controller;
use App\Http\Requests\DataQualityRequest;
use App\Services\DataQualityService;
use Illuminate\Http\JsonResponse;

class DataQualityController extends Controller
{
    public function summary(DataQualityRequest $request, DataQualityService $service): JsonResponse
    {
        return $this->respond($request, $service, true);
    }

    public function issues(DataQualityRequest $request, DataQualityService $service): JsonResponse
    {
        return $this->respond($request, $service, false);
    }

    private function respond(DataQualityRequest $request, DataQualityService $service, bool $summary): JsonResponse
    {
        $integration = $request->user()->ownerCompany()->integrations()->findOrFail($request->integer('integration_id'));
        if (! $integration->is_active) {
            return response()->json([
                'message' => 'Выбранная база 1С отключена.',
                'code' => 'integration_inactive',
            ], 409);
        }

        try {
            $snapshot = $service->snapshot($integration, $request->boolean('refresh'));
        } catch (OneCException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'code' => 'onec_unavailable',
            ], 502);
        }

        return response()->json($summary
            ? $snapshot->summary()
            : $snapshot->issueList($request->string('severity')->toString() ?: null, $request->string('category')->toString() ?: null));
    }
}
