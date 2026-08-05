<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Datos manuales del módulo de Etiquetas (ej. referencia de proveedor y
     * peso/multiplicador) — se cargan una vez desde el panel y quedan
     * guardados por producto/variante, sin volver a escribirlos cada vez.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('label_ref')->nullable()->after('barcode');
            $table->string('label_weight')->nullable()->after('label_ref');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('label_ref')->nullable()->after('barcode');
            $table->string('label_weight')->nullable()->after('label_ref');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['label_ref', 'label_weight']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['label_ref', 'label_weight']);
        });
    }
};
