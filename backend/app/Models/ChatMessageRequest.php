<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'chat_id',
    'request_id',
    'content_hash',
    'integration_id',
    'status',
    'user_message_id',
    'assistant_message_id',
    'started_at',
    'completed_at',
])]
class ChatMessageRequest extends Model
{
    public const PROCESSING = 'processing';

    public const COMPLETED = 'completed';

    public const UNKNOWN = 'unknown';

    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Chat, $this> */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    /** @return BelongsTo<Integration, $this> */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    /** @return BelongsTo<Message, $this> */
    public function userMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'user_message_id');
    }

    /** @return BelongsTo<Message, $this> */
    public function assistantMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'assistant_message_id');
    }
}
