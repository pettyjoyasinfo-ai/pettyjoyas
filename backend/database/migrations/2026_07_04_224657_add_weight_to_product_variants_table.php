<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Peso en gramos de la variante (ej. distintos gramajes de una misma
     * pieza). Opcional: hay productos (relojes, etc.) que no se venden por
     * peso. Se muestra en la ficha de producto de la tienda.
     */
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('weight', 8, 2)->nullable()->after('price_delta');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('weight');
        });
    }
};
