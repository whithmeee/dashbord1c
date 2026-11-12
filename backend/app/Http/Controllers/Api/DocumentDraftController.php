<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\DocumentException;
use App\Exceptions\OneCRejectedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentDraftRequest;
use App\Http\Requests\UpdateDocumentDraftRequest;
use App\Http\Resources\DocumentDraftResource;
use App\Models\DocumentDraft;
use App\Models\Integration;
use App\Services\Documents\DocumentDraftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class DocumentDraftController extends Controller
{
    public function __construct(private readonly DocumentDraftService $drafts) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = DocumentDraft::whereMorphedTo('author', $request->user())->latest('id');

        if ($request->filled('integration_id')) {
            $query->where('integration_id', $request->integer('integration_id'));
        }

        return DocumentDraftResource::collection($query->get());
    }

    public function store(StoreDocumentDraftRequest $request): DocumentDraftResource|JsonResponse
    {
        $integration = Integration::findOrFail($request->integer('integration_id'));

        return $this->respond(
            fn (): DocumentDraft => $this->drafts->create($request->user(), $integration, $request->file('file')),
            201,
        );
    }

    public function show(DocumentDraft $document): DocumentDraftResource
    {
        Gate::authorize('view', $document);

        return new DocumentDraftResource($document);
    }

    public function update(UpdateDocumentDraftRequest $request, DocumentDraft $document): DocumentDraftResource|JsonResponse
    {
        Gate::authorize('view', $document);

        return $this->respond(fn (): DocumentDraft => $this->drafts->update($document, $request->validated('data')));
    }

    public function retry(DocumentDraft $document): DocumentDraftResource|JsonResponse
    {
        Gate::authorize('view', $document);

        return $this->respond(fn (): DocumentDraft => $this->drafts->retry($document));
    }

    public function write(DocumentDraft $document): DocumentDraftResource|JsonResponse
    {
        Gate::authorize('view', $document);

        return $this->respond(fn (): DocumentDraft => $this->drafts->write($document));
    }

    public function destroy(DocumentDraft $document): Response
    {
        Gate::authorize('view', $document);

        $document->delete();

        return response()->noContent();
    }

    private function respond(callable $action, int $status = 200): DocumentDraftResource|JsonResponse
    {
        try {
            return (new DocumentDraftResource($action()))->response()->setStatusCode($status);
        } catch (DocumentException|OneCRejectedException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }
}
