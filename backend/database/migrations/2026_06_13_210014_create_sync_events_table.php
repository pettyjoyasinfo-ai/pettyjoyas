<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sync_events', function (Blueprint $table) {
            // UUID generado en el cliente → idempotencia ante reintentos.
            $table->uuid('id')->primary();
            $table->string('type'); // BusinessEventType
            $table->json('payload')->nullable();
            $table->string('status')->default('accepted'); // accepted | duplicate | error
            $table->bigInteger('client_created_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_events');
    }
};
