<?php

namespace App\Models;

use Database\Factories\DocumentDraftFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DocumentDraft extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_WRITTEN = 'written';

    /** @use HasFactory<DocumentDraftFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'issues' => 'array',
            'written_at' => 'datetime',
        ];
    }

    /**
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

    public function isWritten(): bool
    {
        return $this->status === self::STATUS_WRITTEN;
    }

    public function hasErrors(): bool
    {
        return collect($this->issues)->contains(fn (array $issue): bool => $issue['level'] === 'error');
    }
}
