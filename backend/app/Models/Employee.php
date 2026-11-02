<?php

namespace App\Models;

use Database\Factories\EmployeeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

#[Fillable(['company_id', 'name', 'position', 'login', 'password'])]
#[Hidden(['password', 'remember_token'])]
class Employee extends Authenticatable
{
    /** @use HasFactory<EmployeeFactory> */
    use HasFactory;

    public const ONLINE_WINDOW_MINUTES = 5;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Company, $this>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * @return MorphMany<Chat, $this>
     */
    public function chats(): MorphMany
    {
        return $this->morphMany(Chat::class, 'author');
    }

    /**
     * Lets code treat a company and its employees uniformly.
     */
    public function ownerCompany(): Company
    {
        return $this->company;
    }

    public function isOnline(): bool
    {
        return $this->last_seen_at !== null
            && $this->last_seen_at->gt(now()->subMinutes(self::ONLINE_WINDOW_MINUTES));
    }
}
