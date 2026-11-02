<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'email' => fake()->unique()->companyEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'email_verified_at' => now(),
            'subscription_starts_at' => now()->subMonth()->toDateString(),
            'subscription_ends_at' => now()->addMonths(11)->toDateString(),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => ['email_verified_at' => null]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'subscription_starts_at' => now()->subYear()->subDay()->toDateString(),
            'subscription_ends_at' => now()->subDay()->toDateString(),
        ]);
    }
}
