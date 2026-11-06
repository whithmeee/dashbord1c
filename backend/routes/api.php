<?php

use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\MessageController;
use Illuminate\Support\Facades\Route;

/*
| The "Chat" section: conversations answered by DeepSeek using data read from the company's 1C.
| Available to a company and its employees with a confirmed email and an active subscription.
| Authenticated by the same session cookie as the web routes (Sanctum stateful SPA).
*/
Route::middleware(['auth:sanctum', 'last.seen', 'company.access:subscription'])->group(function () {
    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'store']);
    Route::patch('/chats/{chat}', [ChatController::class, 'update']);
    Route::delete('/chats/{chat}', [ChatController::class, 'destroy']);

    Route::get('/chats/{chat}/messages', [MessageController::class, 'index']);
    Route::post('/chats/{chat}/messages', [MessageController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/chats/{chat}/message-requests/{requestId}', [MessageController::class, 'status']);
});
