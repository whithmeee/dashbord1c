<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seed the fixed roles. Safe to run repeatedly.
     */
    public function run(): void
    {
        Role::upsert([
            ['id' => Role::ADMIN_ID, 'name' => 'admin', 'label' => 'Администратор'],
            ['id' => Role::USER_ID, 'name' => 'user', 'label' => 'Пользователь'],
        ], ['id'], ['name', 'label']);
    }
}
