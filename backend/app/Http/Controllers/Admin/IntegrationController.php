<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreIntegrationRequest;
use App\Http\Requests\Admin\UpdateIntegrationRequest;
use App\Http\Resources\IntegrationResource;
use App\Models\Integration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Http;

class IntegrationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $integrations = Integration::query()
            ->when($request->integer('company_id'), fn ($query, int $companyId) => $query->where('company_id', $companyId))
            ->latest('id')
            ->get();

        return IntegrationResource::collection($integrations);
    }

    /**
     * Connect a company's 1C database. The password is stored encrypted and never returned.
     */
    public function store(StoreIntegrationRequest $request): JsonResponse
    {
        $integration = Integration::create($request->validated() + ['is_active' => true]);

        return (new IntegrationResource($integration))->response()->setStatusCode(201);
    }

    public function update(UpdateIntegrationRequest $request, Integration $integration): IntegrationResource
    {
        $integration->update(array_filter(
            $request->validated(),
            fn (mixed $value, string $key): bool => $key !== 'password' || filled($value),
            ARRAY_FILTER_USE_BOTH,
        ));

        return new IntegrationResource($integration);
    }

    public function destroy(Integration $integration): JsonResponse
    {
        $integration->delete();

        return response()->json(null, 204);
    }

    public function testConnection(Integration $integration): JsonResponse
    {
        try {
            $url = rtrim($integration->odata_url, '/').'/Catalog_Номенклатура';

            $response = Http::withBasicAuth($integration->login, $integration->password)
                ->acceptJson()
                ->get($url, [
                    '$format' => 'json',
                    '$top' => 5,
                ]);

            if ($response->successful()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Связь с 1С успешно установлена!',
                    'data' => $response->json(),
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => '1С ответила с ошибкой',
                'code' => $response->status(),
                'body' => $response->body(),
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Не удалось достучаться до 1С: '.$e->getMessage(),
            ], 500);
        }
    }
}
