<?php

namespace App\Policies;

use App\Models\DocumentDraft;
use Illuminate\Contracts\Auth\Authenticatable;

class DocumentDraftPolicy
{
    public function view(Authenticatable $account, DocumentDraft $draft): bool
    {
        return $draft->author?->is($account) ?? false;
    }
}
