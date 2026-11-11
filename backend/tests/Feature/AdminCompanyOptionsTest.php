<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCompanyOptionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_admin_gets_every_company_as_id_and_name_ordered_by_name(): void
    {
        Company::factory()->create(['name' => 'Ярмарка']);
        Company::factory()->create(['name' => 'Альфа']);
        $this->actingAs(User::factory()->admin()->create());

        $response = $this->getJson('/admin-panel/companies/options');

        $response->assertOk();
        $this->assertSame(['Альфа', 'Ярмарка'], collect($response->json())->pluck('name')->all());
        $this->assertSame(['id', 'name'], array_keys($response->json(0)));
    }

    public function test_company_options_are_hidden_from_non_administrators(): void
    {
        $this->actingAs(Company::factory()->create(), 'company');

        $this->getJson('/admin-panel/companies/options')->assertNotFound();
    }
}
