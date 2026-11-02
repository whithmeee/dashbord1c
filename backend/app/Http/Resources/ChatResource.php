<?php

namespace App\Http\Resources;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Chat
 */
class ChatResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'integration_id' => $this->integration_id,
            'integration' => $this->whenLoaded('integration', fn () => (new IntegrationResource($this->integration))->resolve($request)),
            'title' => $this->title,
            'created_at' => $this->created_at,
        ];
    }
}
