<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Oculto de la tienda online (no del panel ni del POS) aunque tenga
            // stock. Distinto de `active`, que es el archivado ("eliminado").
            $table->boolean('hidden')->default(false)->after('active');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('hidden');
        });
    }
};
