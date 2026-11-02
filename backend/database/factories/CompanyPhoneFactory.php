<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\CompanyPhone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanyPhone>
 */
class CompanyPhoneFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'phone' => fake()->numerify('+7##########'),
            'label' => fake()->randomElement(['Приёмная', 'Бухгалтерия', null]),
        ];
    }
}
