<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\ChatMessageRequest;
use App\Models\Message;
use App\Services\ChatService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Throwable;

class MessageController extends Controller
{
    public function index(Chat $chat): AnonymousResourceCollection
    {
        Gate::authorize('view', $chat);

        return MessageResource::collection($chat->messages()->orderBy('id')->get());
    }

    /**
     * Ask a question: returns the assistant's reply with the computed `widget` table and AI `content`.
     */
    public function store(SendMessageRequest $request, Chat $chat, ChatService $chatService): MessageResource|JsonResponse
    {
        Gate::authorize('view', $chat);

        if (! $chat->integration->is_active) {
            abort(response()->json([
                'message' => 'Выбранная база 1С отключена. Переключитесь на другую базу.',
                'code' => 'integration_inactive',
            ], 409));
        }

        $key = $request->header('Idempotency-Key');
        if ($key === null || $key === '') {
            return new MessageResource($chatService->ask($chat, $request->validated('content')));
        }

        if (! Str::isUuid($key)) {
            return response()->json(['message' => 'Idempotency-Key должен быть UUID.', 'code' => 'invalid_idempotency_key'], 422);
        }

        $content = $request->validated('content');
        $operation = $this->findOrCreateOperation($chat, $key, $content);
        if ($operation instanceof MessageResource || $operation instanceof JsonResponse) {
            return $operation;
        }

        try {
            return new MessageResource($chatService->ask($chat, $content, $operation));
        } catch (Throwable $exception) {
            $operation->update(['status' => ChatMessageRequest::UNKNOWN]);
            throw $exception;
        }
    }

    public function status(Request $request, Chat $chat, string $requestId): JsonResponse
    {
        Gate::authorize('view', $chat);
        abort_unless(Str::isUuid($requestId), 404);

        $operation = ChatMessageRequest::query()
            ->where('chat_id', $chat->id)
            ->where('request_id', $requestId)
            ->with('assistantMessage')
            ->firstOrFail();

        return response()->json($this->statusPayload($request, $operation));
    }

    private function findOrCreateOperation(Chat $chat, string $key, string $content): ChatMessageRequest|MessageResource|JsonResponse
    {
        $hash = hash('sha256', $content);
        try {
            return DB::transaction(function () use ($chat, $key, $hash, $content): ChatMessageRequest {
                $operation = ChatMessageRequest::create([
                    'chat_id' => $chat->id,
                    'request_id' => $key,
                    'content_hash' => $hash,
                    'integration_id' => $chat->integration_id,
                    'status' => ChatMessageRequest::PROCESSING,
                    'started_at' => now(),
                ]);
                $userMessage = $chat->messages()->create([
                    'integration_id' => $chat->integration_id,
                    'role' => Message::ROLE_USER,
                    'content' => $content,
                ]);
                $operation->update(['user_message_id' => $userMessage->id]);

                return $operation->load('userMessage');
            });
        } catch (QueryException $exception) {
            $operation = ChatMessageRequest::query()
                ->where('chat_id', $chat->id)
                ->where('request_id', $key)
                ->with('assistantMessage')
                ->first();
            if ($operation === null) {
                throw $exception;
            }
        }

        if ($operation->content_hash !== $hash || $operation->integration_id !== $chat->integration_id) {
            return response()->json(['message' => 'Idempotency-Key уже использован для другого запроса.', 'code' => 'idempotency_key_conflict'], 409);
        }

        if ($operation->status === ChatMessageRequest::COMPLETED && $operation->assistantMessage !== null) {
            return new MessageResource($operation->assistantMessage);
        }

        if ($operation->status === ChatMessageRequest::PROCESSING
            && $operation->started_at?->lt(now()->subMinutes(5))) {
            $operation->update(['status' => ChatMessageRequest::UNKNOWN]);
        }

        $operation = $operation->fresh('assistantMessage');
        $code = $operation->status === ChatMessageRequest::UNKNOWN
            ? 'message_request_unknown'
            : 'message_request_processing';

        return response()->json($this->statusPayload(request(), $operation) + [
            'message' => $operation->status === ChatMessageRequest::UNKNOWN
                ? 'Результат запроса неизвестен. Обновите историю сообщений.'
                : 'Запрос ещё выполняется.',
            'code' => $code,
        ], 409);
    }

    /** @return array<string, mixed> */
    private function statusPayload(Request $request, ChatMessageRequest $operation): array
    {
        $payload = [
            'request_id' => $operation->request_id,
            'status' => $operation->status,
        ];
        if ($operation->status === ChatMessageRequest::COMPLETED && $operation->assistantMessage !== null) {
            $payload['message'] = (new MessageResource($operation->assistantMessage))->resolve($request);
        }

        return $payload;
    }
}
