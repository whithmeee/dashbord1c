<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardViewerTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_is_shown_as_an_employee_of_the_company(): void
    {
        $company = Company::factory()->create(['name' => 'ООО Ромашка']);
        $employee = Employee::factory()->for($company)->create(['name' => 'Иван Петров', 'position' => 'Бухгалтер']);
        $this->actingAs($employee, 'employee');

        $this->getJson('/cabinet/dashboard')
            ->assertOk()
            ->assertJsonPath('company.name', 'ООО Ромашка')
            ->assertJsonPath('viewer', ['type' => 'employee', 'name' => 'Иван Петров', 'position' => 'Бухгалтер']);
    }

    public function test_owner_is_shown_as_the_company(): void
    {
        $company = Company::factory()->create(['name' => 'ООО Ромашка']);
        $this->actingAs($company, 'company');

        $this->getJson('/cabinet/dashboard')
            ->assertOk()
            ->assertJsonPath('viewer', ['type' => 'company', 'name' => 'ООО Ромашка', 'position' => null]);
    }
}
