<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Permite carritos de invitado: `user_id` pasa a nullable y se agrega
 * `guest_token` (único) para identificar el carrito de alguien sin sesión.
 * Evita doctrine/dbal (no instalado) usando SQL crudo para el ALTER de columna.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->string('guest_token', 64)->nullable()->after('user_id');
        });

        // El índice único de user_id sostiene la FK — hay que soltar la FK primero.
        DB::statement('ALTER TABLE carts DROP FOREIGN KEY carts_user_id_foreign');
        DB::statement('ALTER TABLE carts DROP INDEX carts_user_id_unique');
        DB::statement('ALTER TABLE carts MODIFY user_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE carts ADD UNIQUE carts_user_id_unique (user_id)');
        DB::statement('ALTER TABLE carts ADD CONSTRAINT carts_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE carts ADD UNIQUE carts_guest_token_unique (guest_token)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE carts DROP INDEX carts_guest_token_unique');
        DB::statement('ALTER TABLE carts DROP FOREIGN KEY carts_user_id_foreign');
        DB::statement('ALTER TABLE carts DROP INDEX carts_user_id_unique');
        DB::table('carts')->whereNull('user_id')->delete();
        DB::statement('ALTER TABLE carts MODIFY user_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE carts ADD UNIQUE carts_user_id_unique (user_id)');
        DB::statement('ALTER TABLE carts ADD CONSTRAINT carts_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');

        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('guest_token');
        });
    }
};
