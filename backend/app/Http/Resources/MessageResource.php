<?php

namespace App\Http\Resources;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Message
 */
class MessageResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chat_id' => $this->chat_id,
            'integration_id' => $this->integration_id,
            'role' => $this->role,
            'content' => $this->content,
            'widget' => $this->widget,
            'created_at' => $this->created_at,
        ];
    }
}
