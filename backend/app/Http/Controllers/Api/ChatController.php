<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChatRequest;
use App\Http\Requests\UpdateChatRequest;
use App\Http\Resources\ChatResource;
use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ChatController extends Controller
{
    /**
     * The caller's own chats: a company sees its chats, an employee sees theirs.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        return ChatResource::collection(
            Chat::whereMorphedTo('author', $request->user())->with('integration')->latest('id')->get()
        );
    }

    public function store(StoreChatRequest $request): ChatResource
    {
        $chat = $request->user()->chats()->create($request->validated());

        return new ChatResource($chat->load('integration'));
    }

    public function destroy(Chat $chat): Response
    {
        Gate::authorize('view', $chat);

        $chat->delete();

        return response()->noContent();
    }

    /**
     * Rename the chat or switch it to another database: the next questions go to the selected 1C.
     */
    public function update(UpdateChatRequest $request, Chat $chat): ChatResource
    {
        Gate::authorize('view', $chat);

        $chat->update($request->validated());

        return new ChatResource($chat->load('integration'));
    }
}
