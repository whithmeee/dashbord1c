<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RussianErrorsTest extends TestCase
{
    use RefreshDatabase;

    public function test_wrong_credentials_are_reported_in_russian(): void
    {
        $this->postJson('/auth/login', ['login' => 'nobody', 'password' => 'wrong'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Неверный логин или пароль.')
            ->assertJsonPath('errors.login.0', 'Неверный логин или пароль.');
    }

    public function test_validation_errors_are_reported_in_russian_with_field_names(): void
    {
        $this->postJson('/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonPath('errors.login.0', 'Поле логин обязательно для заполнения.')
            ->assertJsonPath('errors.password.0', 'Поле пароль обязательно для заполнения.');

        $this->actingAs(Company::factory()->create(), 'company');
        $this->postJson('/cabinet/employees', [
            'name' => 'Иван', 'position' => 'Менеджер', 'login' => 'ivan', 'password' => 'weakweak',
        ])->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'Поле пароль должно содержать хотя бы одну цифру.');
    }

    public function test_framework_errors_are_reported_in_russian(): void
    {
        $this->getJson('/auth/me')->assertUnauthorized()->assertJsonPath('message', 'Требуется вход в систему.');
        $this->getJson('/no-such-route')->assertNotFound()->assertJsonPath('message', 'Не найдено.');

        $this->actingAs(Company::factory()->create(), 'company');
        $this->getJson('/cabinet/integrations/999999/check')
            ->assertNotFound()
            ->assertJsonPath('message', 'Не найдено.');
        $this->getJson('/admin-panel/companies')->assertNotFound()->assertJsonPath('message', 'Не найдено.');
    }

    public function test_authorization_failures_are_reported_in_russian(): void
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee, 'employee');

        $this->getJson('/cabinet/settings')->assertForbidden()->assertJsonPath('message', 'Доступно только владельцу компании.');
    }
}
