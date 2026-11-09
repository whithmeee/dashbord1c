<?php

namespace Database\Factories;

use App\Enums\CabinetSection;
use App\Models\Company;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->name(),
            'position' => fake()->jobTitle(),
            'login' => fake()->unique()->userName(),
            'sections' => CabinetSection::values(),
            'password' => static::$password ??= Hash::make('password'),
        ];
    }

    public function online(): static
    {
        return $this->state(fn (array $attributes) => ['last_seen_at' => now()]);
    }
}
