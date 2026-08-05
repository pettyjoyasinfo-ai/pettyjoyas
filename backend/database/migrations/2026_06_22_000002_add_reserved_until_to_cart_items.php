<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            // Reserva de stock: la unidad en carrito bloquea stock por 20 minutos.
            $table->timestamp('reserved_until')->nullable()->after('unit_price');
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropColumn('reserved_until');
        });
    }
};
