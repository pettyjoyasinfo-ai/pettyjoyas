<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // 'venta' = pedido/venta común. 'cambio' y 'devolucion' son el asiento de caja
            // de la diferencia de un cambio (total = lo cobrado, o negativo si se reintegró):
            // suman a los montos de caja pero no cuentan como una venta más.
            $table->string('kind', 20)->default('venta')->after('channel');
        });

        Schema::create('exchanges', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique(); // CAM-000001
            $table->string('kind', 20); // cambio | devolucion
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('cash_register_id')->nullable()->constrained('cash_registers');
            $table->foreignId('original_order_id')->nullable()->constrained('orders');
            $table->foreignId('ledger_order_id')->nullable()->constrained('orders');
            $table->text('reason')->nullable();
            // Pesos enteros. difference = delivered_total - returned_total
            // (positivo: el cliente paga; negativo: queda a favor del cliente).
            $table->integer('returned_total')->default(0);
            $table->integer('delivered_total')->default(0);
            $table->integer('difference')->default(0);
            // sin_diferencia | cobrado | reintegrado | saldo_a_favor
            $table->string('settlement', 20);
            $table->string('payment_method', 20)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('exchange_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exchange_id')->constrained('exchanges')->cascadeOnDelete();
            $table->string('direction', 3); // in = devuelto por el cliente, out = entregado al cliente
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('name');
            $table->string('variant_label')->nullable();
            $table->unsignedInteger('quantity');
            $table->integer('unit_price'); // valor reconocido (in) o precio de lista (out)
            $table->boolean('restocked')->default(false); // in: ¿volvió al stock?
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_items');
        Schema::dropIfExists('exchanges');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
    }
};
