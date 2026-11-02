<?php

namespace App\Policies;

use App\Models\Chat;
use Illuminate\Contracts\Auth\Authenticatable;

class ChatPolicy
{
    /**
     * A chat belongs to the company or employee who started it.
     */
    public function view(Authenticatable $account, Chat $chat): bool
    {
        return $chat->author?->is($account) ?? false;
    }
}
