<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\CompanyMessenger;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanyMessenger>
 */
class CompanyMessengerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->randomElement(['Telegram', 'WhatsApp', 'Viber']),
            'contact' => '@'.fake()->userName(),
        ];
    }
}
