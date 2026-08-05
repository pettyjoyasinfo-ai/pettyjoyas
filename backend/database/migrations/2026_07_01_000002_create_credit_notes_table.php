<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_notes', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique(); // NC-000001
            $table->foreignId('order_id')->constrained();
            $table->foreignId('cash_register_id')->nullable()->constrained('cash_registers');
            $table->foreignId('issued_by')->constrained('users');
            $table->text('reason');
            $table->unsignedInteger('amount'); // pesos enteros
            $table->json('items')->nullable();  // ítems devueltos (snapshot)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_notes');
    }
};
