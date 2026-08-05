<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->string('channel')->default('online'); // online | local
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // vendedor (POS)
            $table->string('status')->default('pendiente'); // OrderStatus
            $table->string('payment_method')->nullable();   // PaymentMethod
            $table->string('payment_status')->default('pendiente');
            $table->string('shipping_method')->nullable();  // envio | retiro
            $table->integer('subtotal')->default(0);
            $table->integer('discount')->default(0);
            $table->integer('shipping_cost')->default(0);
            $table->integer('total')->default(0);
            $table->string('coupon_code')->nullable();
            $table->json('address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['channel', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
