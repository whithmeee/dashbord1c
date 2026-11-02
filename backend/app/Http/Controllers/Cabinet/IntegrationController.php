<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use App\Http\Resources\IntegrationResource;
use App\Models\Integration;
use App\Services\OneCClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IntegrationController extends Controller
{
    /**
     * The company's connected 1C databases, e.g. for the switcher in the chat.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        return IntegrationResource::collection($request->user()->ownerCompany()->integrations()->orderBy('id')->get());
    }

    /**
     * Live status of one database: `online`, `offline` (1C does not answer) or `inactive` (disabled by the admin).
     */
    public function check(Request $request, Integration $integration): JsonResponse
    {
        abort_unless($integration->company_id === $request->user()->ownerCompany()->id, 404);

        $status = match (true) {
            ! $integration->is_active => 'inactive',
            (new OneCClient($integration))->isReachable() => 'online',
            default => 'offline',
        };

        return response()->json(['id' => $integration->id, 'status' => $status, 'checked_at' => now()]);
    }
}
