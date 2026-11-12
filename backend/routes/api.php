<?php

use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DocumentDraftController;
use App\Http\Controllers\Api\MessageController;
use Illuminate\Support\Facades\Route;

/*
| The "Chat" section: conversations answered by DeepSeek using data read from the company's 1C.
| Available to a company and its employees with a confirmed email and an active subscription.
| Authenticated by the same session cookie as the web routes (Sanctum stateful SPA).
*/
Route::middleware(['auth:sanctum', 'last.seen', 'company.access:subscription', 'section:chat'])->group(function () {
    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'store']);
    Route::patch('/chats/{chat}', [ChatController::class, 'update']);
    Route::delete('/chats/{chat}', [ChatController::class, 'destroy']);

    Route::get('/chats/{chat}/messages', [MessageController::class, 'index']);
    Route::post('/chats/{chat}/messages', [MessageController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/chats/{chat}/message-requests/{requestId}', [MessageController::class, 'status']);

    Route::get('/documents', [DocumentDraftController::class, 'index']);
    Route::post('/documents', [DocumentDraftController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/documents/{document}', [DocumentDraftController::class, 'show']);
    Route::patch('/documents/{document}', [DocumentDraftController::class, 'update']);
    Route::post('/documents/{document}/retry', [DocumentDraftController::class, 'retry'])->middleware('throttle:10,1');
    Route::post('/documents/{document}/write', [DocumentDraftController::class, 'write'])->middleware('throttle:10,1');
    Route::delete('/documents/{document}', [DocumentDraftController::class, 'destroy']);
});
