<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock')->default(0)->after('price');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->unsignedInteger('stock')->default(0)->after('price_delta');
        });

        // Populate from existing stock_movements so no data is lost.
        DB::statement('
            UPDATE products p
            SET p.stock = GREATEST(0, COALESCE(
                (SELECT SUM(quantity) FROM stock_movements WHERE product_id = p.id AND product_variant_id IS NULL),
                0
            ))
        ');

        DB::statement('
            UPDATE product_variants pv
            SET pv.stock = GREATEST(0, COALESCE(
                (SELECT SUM(quantity) FROM stock_movements WHERE product_variant_id = pv.id),
                0
            ))
        ');
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('stock');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('stock');
        });
    }
};
