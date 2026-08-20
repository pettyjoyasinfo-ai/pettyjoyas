<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            // Subgrupo opcional dentro de un mismo type (ej. "Femenino"/"Masculino"
            // para separar los talles de una alianza). Si queda null, la variante
            // se sigue mostrando igual que siempre (sin subtítulo).
            $table->string('group')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('group');
        });
    }
};
