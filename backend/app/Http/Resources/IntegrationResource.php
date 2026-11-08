<?php

namespace App\Http\Resources;

use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Integration
 */
class IntegrationResource extends JsonResource
{
    public static $wrap = null;

    /**
     * The 1C password is never exposed.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'odata_url' => $this->odata_url,
            'login' => $this->login,
            'config_name' => $this->config_name,
            'is_active' => $this->is_active,
            'status' => $this->is_active ? 'active' : 'inactive',
            'connected_at' => $this->created_at,
        ];
    }
}
