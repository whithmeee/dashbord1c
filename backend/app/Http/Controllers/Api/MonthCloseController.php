<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\OneCException;
use App\Exceptions\OneCRejectedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\MonthCloseRequest;
use App\Services\MonthClose\MonthCloseRules;
use App\Services\MonthClose\MonthCloseService;
use Illuminate\Http\JsonResponse;

class MonthCloseController extends Controller
{
    public function __construct(private readonly MonthCloseService $service) {}

    public function summary(MonthCloseRequest $request): JsonResponse
    {
        return $this->respond($request, fn ($integration): array => $this->service->summary(
            $integration,
            $request->string('month')->toString(),
            $request->boolean('refresh'),
        ));
    }

    public function details(MonthCloseRequest $request, string $check): JsonResponse
    {
        abort_unless(isset(MonthCloseRules::CHECKS[$check]), 404);

        return $this->respond($request, fn ($integration): array => $this->service->details(
            $integration,
            $request->string('month')->toString(),
            $check,
        ));
    }

    private function respond(MonthCloseRequest $request, callable $action): JsonResponse
    {
        $integration = $request->user()->ownerCompany()->integrations()->findOrFail($request->integer('integration_id'));

        if (! $integration->is_active) {
            return response()->json(['message' => 'Выбранная база 1С отключена.', 'code' => 'integration_inactive'], 409);
        }

        try {
            return response()->json($action($integration));
        } catch (OneCRejectedException $exception) {
            return response()->json(['message' => $exception->getMessage(), 'code' => 'onec_rejected'], 422);
        } catch (OneCException $exception) {
            return response()->json(['message' => $exception->getMessage(), 'code' => 'onec_unavailable'], 502);
        }
    }
}
