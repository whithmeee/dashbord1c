<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Services\ChatService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

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
    public function store(SendMessageRequest $request, Chat $chat, ChatService $chatService): MessageResource
    {
        Gate::authorize('view', $chat);

        if (! $chat->integration->is_active) {
            abort(response()->json([
                'message' => 'Выбранная база 1С отключена. Переключитесь на другую базу.',
                'code' => 'integration_inactive',
            ], 409));
        }

        return new MessageResource($chatService->ask($chat, $request->validated('content')));
    }
}
