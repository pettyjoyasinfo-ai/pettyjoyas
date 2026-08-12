<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Se guarda una "foto" del producto al momento de la venta — igual que ya se
 * guarda name/variant_label/unit_price — para que el pedido siga mostrando
 * la imagen correcta aunque el producto cambie de foto o se borre después.
 * Pedidos viejos quedan con image=null (no hay forma de reconstruirla).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('image')->nullable()->after('variant_label');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('image');
        });
    }
};
