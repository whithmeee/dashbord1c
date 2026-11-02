<?php

namespace App\Http\Resources;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Employee
 */
class EmployeeResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'position' => $this->position,
            'login' => $this->login,
            'is_online' => $this->isOnline(),
            'last_seen_at' => $this->last_seen_at,
        ];
    }
}
