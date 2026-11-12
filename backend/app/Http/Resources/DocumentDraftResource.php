<?php

namespace App\Http\Resources;

use App\Models\DocumentDraft;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DocumentDraft
 */
class DocumentDraftResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'integration_id' => $this->integration_id,
            'file_name' => $this->file_name,
            'profile' => $this->profile,
            'status' => $this->status,
            'ready' => ! $this->isWritten() && ! $this->hasErrors(),
            'data' => $this->data,
            'issues' => $this->issues,
            'onec_number' => $this->onec_number,
            'written_at' => $this->written_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
