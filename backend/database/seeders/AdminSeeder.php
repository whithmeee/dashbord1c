<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Create the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD.
     */
    public function run(): void
    {
        $email = config('app.default_admin.email');
        $password = config('app.default_admin.password');

        if (! $email || ! $password) {
            $this->command?->warn('ADMIN_EMAIL / ADMIN_PASSWORD не заданы, администратор не создан.');

            return;
        }

        $admin = User::firstOrNew(['email' => $email]);

        if (! $admin->exists) {
            $admin->forceFill([
                'name' => config('app.default_admin.name'),
                'password' => $password,
            ]);
        }

        $admin->role_id = Role::ADMIN_ID;
        $admin->save();
    }
}
