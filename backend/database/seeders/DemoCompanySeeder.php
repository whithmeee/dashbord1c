<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class DemoCompanySeeder extends Seeder
{
    public function run(): void
    {
        $email = config('app.demo_company.email');
        $password = config('app.demo_company.password');

        if (! $email || ! $password) {
            return;
        }

        Company::updateOrCreate(
            ['email' => $email],
            [
                'name' => config('app.demo_company.name', 'Тестовая компания'),
                'password' => $password,
                'email_verified_at' => now(),
                'subscription_starts_at' => now()->subMonth()->toDateString(),
                'subscription_ends_at' => now()->addYear()->toDateString(),
            ],
        );
    }
}
