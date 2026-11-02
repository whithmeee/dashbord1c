<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\Company;
use App\Models\Integration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Chat>
 */
class ChatFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'integration_id' => Integration::factory(),
            'author_type' => 'company',
            'author_id' => Company::factory(),
            'title' => 'Новый диалог',
        ];
    }
}
