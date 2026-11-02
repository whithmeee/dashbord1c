<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Integration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Integration>
 */
class IntegrationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => '1С Тест',
            'odata_url' => 'https://1cfresh.test/a/demo/odata/standard.odata',
            'login' => fake()->userName(),
            'password' => fake()->password(),
            'config_name' => 'Бухгалтерия предприятия',
            'is_active' => true,
        ];
    }
}
