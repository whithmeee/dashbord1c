<?php

namespace Tests\Feature;

use App\Models\Company;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_login_rate_limit_is_scoped_by_login_and_ip(): void
    {
        $company = Company::factory()->create([
            'email' => 'second@example.test',
            'password' => 'secret-pass1',
        ]);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/auth/login', [
                'login' => 'first@example.test',
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/auth/login', [
            'login' => $company->email,
            'password' => 'secret-pass1',
        ])->assertOk();
    }

    public function test_login_rate_limit_cannot_be_bypassed_with_letter_case(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/auth/login', [
                'login' => 'owner@example.test',
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/auth/login', [
            'login' => 'OWNER@example.test',
            'password' => 'wrong-password',
        ])->assertTooManyRequests();
    }
}
