<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'company_id',
    'actor_type',
    'actor_id',
    'chat_id',
    'chat_message_request_id',
    'call_index',
    'provider_request_id',
    'model',
    'prompt_tokens',
    'completion_tokens',
    'cached_tokens',
    'cache_miss_tokens',
    'total_tokens',
    'status',
    'started_at',
    'completed_at',
])]
class DeepSeekUsage extends Model
{
    protected $table = 'deepseek_usages';

    public const RECORDED = 'recorded';

    public const UNKNOWN = 'unknown';

    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<Chat, $this> */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    /** @return BelongsTo<ChatMessageRequest, $this> */
    public function chatMessageRequest(): BelongsTo
    {
        return $this->belongsTo(ChatMessageRequest::class);
    }
}
