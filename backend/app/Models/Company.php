<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'subscription_starts_at', 'subscription_ends_at'])]
#[Hidden(['password', 'remember_token', 'email_verification_code_hash'])]
class Company extends Authenticatable
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'email_verified_at' => 'datetime',
            'email_verification_code_expires_at' => 'datetime',
            'subscription_starts_at' => 'date',
            'subscription_ends_at' => 'date',
        ];
    }

    /**
     * @return HasMany<CompanyPhone, $this>
     */
    public function phones(): HasMany
    {
        return $this->hasMany(CompanyPhone::class);
    }

    /**
     * @return HasMany<CompanyMessenger, $this>
     */
    public function messengers(): HasMany
    {
        return $this->hasMany(CompanyMessenger::class);
    }

    /**
     * @return HasMany<Employee, $this>
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * @return HasMany<Integration, $this>
     */
    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
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
    public function ownerCompany(): self
    {
        return $this;
    }

    public function hasVerifiedEmail(): bool
    {
        return $this->email_verified_at !== null;
    }

    public function isSubscriptionActive(): bool
    {
        $today = now()->startOfDay();

        return $this->subscription_starts_at->lte($today) && $this->subscription_ends_at->gte($today);
    }

    /**
     * Replace the company's phones and messengers. A null list leaves that collection untouched.
     *
     * @param  list<array{phone: string, label?: ?string}>|null  $phones
     * @param  list<array{name: string, contact: string}>|null  $messengers
     */
    public function replaceContacts(?array $phones, ?array $messengers): void
    {
        if ($phones !== null) {
            $this->phones()->delete();
            $this->phones()->createMany($phones);
        }

        if ($messengers !== null) {
            $this->messengers()->delete();
            $this->messengers()->createMany($messengers);
        }
    }
}
