<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('app.client.email');
        $password = config('app.client.password');

        if (! $email || ! $password) {
            return;
        }

        Company::updateOrCreate(
            ['email' => $email],
            [
                'name' => config('app.client.name') ?: 'Клиент',
                'password' => $password,
                'email_verified_at' => now(),
                'subscription_starts_at' => now()->subDay()->toDateString(),
                'subscription_ends_at' => now()->addYear()->toDateString(),
            ],
        );
    }
}
