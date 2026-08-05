<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bandeja de entrada de WhatsApp: persistimos las conversaciones y cada mensaje
 * (entrante del cliente, saliente de la IA o de un vendedor) para poder mostrar
 * el chat en el panel admin y que un humano pueda tomar la conversación.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('wa_id')->unique();          // número/wa_id del cliente
            $table->string('name')->nullable();          // nombre de perfil de WhatsApp
            $table->text('last_message')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->unsignedInteger('unread')->default(0); // mensajes del cliente sin ver por el equipo
            $table->boolean('ai_paused')->default(false);  // true = la IA no responde (lo maneja un humano)
            $table->timestamps();

            $table->index('last_message_at');
        });

        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->string('wa_id')->index();
            $table->string('direction');                 // 'in' (del cliente) | 'out' (nuestro)
            $table->string('sender');                    // 'customer' | 'ai' | 'staff'
            $table->text('body')->nullable();
            $table->string('type')->default('text');     // text, image, audio, etc.
            $table->string('wam_id')->nullable();         // id del mensaje en WhatsApp
            $table->timestamps();

            $table->index(['wa_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_conversations');
    }
};
