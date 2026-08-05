<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('email_flows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('trigger');
            $table->text('template')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('open_rate')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_flows');
    }
};
