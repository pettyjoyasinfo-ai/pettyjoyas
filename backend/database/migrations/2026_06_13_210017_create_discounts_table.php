<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Promociones automáticas: % o monto fijo aplicado a todo el catálogo, una
 * categoría o productos puntuales, por un período. Opcionalmente por link único.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // percent | fixed
            $table->integer('value');
            $table->string('scope')->default('all'); // all | category | products
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->json('product_ids')->nullable();
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->boolean('active')->default(true);
            // Link único: si requires_token, solo aplica con ?promo=token.
            $table->boolean('requires_token')->default(false);
            $table->string('token')->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
