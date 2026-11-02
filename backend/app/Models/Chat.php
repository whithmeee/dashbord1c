<?php

namespace App\Models;

use Database\Factories\ChatFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable(['integration_id', 'title'])]
class Chat extends Model
{
    /** @use HasFactory<ChatFactory> */
    use HasFactory;

    /**
     * The company or employee who started the chat.
     *
     * @return MorphTo<Model, $this>
     */
    public function author(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<Integration, $this>
     */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    /**
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
