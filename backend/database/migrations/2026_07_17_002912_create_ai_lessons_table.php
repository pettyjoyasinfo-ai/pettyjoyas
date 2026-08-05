<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Aprendizajes" de la IA: instrucciones/conocimiento individuales que el
 * equipo carga desde el panel. Cada uno es una clase editable/eliminable. Se
 * inyectan en el prompt de AMBOS chatbots (WhatsApp y el chat de la tienda).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_lessons', function (Blueprint $table) {
            $table->id();
            $table->text('content');
            $table->boolean('active')->default(true); // permite pausar sin borrar
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_lessons');
    }
};
