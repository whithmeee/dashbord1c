<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'chat_id' => Chat::factory(),
            'integration_id' => fn (array $attributes): int => Chat::findOrFail($attributes['chat_id'])->integration_id,
            'role' => Message::ROLE_USER,
            'content' => fake()->sentence(),
            'widget' => null,
        ];
    }
}
