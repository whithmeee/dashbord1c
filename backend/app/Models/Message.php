<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['chat_id', 'integration_id', 'role', 'content', 'widget'])]
class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    public const ROLE_USER = 'user';

    public const ROLE_ASSISTANT = 'assistant';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'widget' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Chat, $this>
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }
}
