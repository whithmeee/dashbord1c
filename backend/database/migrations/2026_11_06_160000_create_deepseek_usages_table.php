<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deepseek_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('actor_type');
            $table->unsignedBigInteger('actor_id');
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('chat_message_request_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('call_index');
            $table->string('provider_request_id')->nullable();
            $table->string('model');
            $table->unsignedInteger('prompt_tokens')->nullable();
            $table->unsignedInteger('completion_tokens')->nullable();
            $table->unsignedInteger('cached_tokens')->nullable();
            $table->unsignedInteger('cache_miss_tokens')->nullable();
            $table->unsignedInteger('total_tokens')->nullable();
            $table->string('status', 20);
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['chat_message_request_id', 'call_index']);
            $table->index(['company_id', 'actor_type', 'actor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deepseek_usages');
    }
};
