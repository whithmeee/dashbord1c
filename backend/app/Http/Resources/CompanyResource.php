<?php

namespace App\Http\Resources;

use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Company
 */
class CompanyResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Clients only see whether the subscription is active; the dates are for administrators.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() instanceof User;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified' => $this->hasVerifiedEmail(),
            'subscription_status' => $this->isSubscriptionActive() ? 'active' : 'inactive',
            'phones' => $this->whenLoaded('phones', fn () => $this->phones->map->only(['id', 'phone', 'label'])->all()),
            'messengers' => $this->whenLoaded('messengers', fn () => $this->messengers->map->only(['id', 'name', 'contact'])->all()),
            'subscription_starts_at' => $this->when($isAdmin, fn () => $this->subscription_starts_at->toDateString()),
            'subscription_ends_at' => $this->when($isAdmin, fn () => $this->subscription_ends_at->toDateString()),
            'employees_count' => $this->whenCounted('employees'),
            'integrations_count' => $this->whenCounted('integrations'),
            'created_at' => $this->created_at,
        ];
    }
}
