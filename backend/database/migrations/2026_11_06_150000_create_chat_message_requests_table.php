<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_message_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->uuid('request_id');
            $table->string('content_hash', 64);
            $table->foreignId('integration_id')->constrained()->restrictOnDelete();
            $table->string('status', 20);
            $table->foreignId('user_message_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->foreignId('assistant_message_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['chat_id', 'request_id']);
            $table->index(['chat_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_message_requests');
    }
};
