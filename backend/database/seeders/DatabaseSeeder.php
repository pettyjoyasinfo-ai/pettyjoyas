<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Staff de ejemplo.
        User::updateOrCreate(['email' => 'admin@pettyjoyas.com'], [
            'name' => 'Romina P.',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
        ]);

        User::updateOrCreate(['email' => 'vendedor@pettyjoyas.com'], [
            'name' => 'Julián M.',
            'password' => Hash::make('password'),
            'role' => UserRole::Vendedor,
        ]);

        // Admin de prueba (local y producción) para validar el panel.
        User::updateOrCreate(['email' => 'admin@admin.com'], [
            'name' => 'Admin',
            'password' => Hash::make('1234'),
            'role' => UserRole::Admin,
        ]);

        $this->call([
            CatalogSeeder::class,
            CategorySeeder::class,
            CrmSalesSeeder::class,
            ReviewSeeder::class,
            EmailFlowSeeder::class,
        ]);
    }
}
