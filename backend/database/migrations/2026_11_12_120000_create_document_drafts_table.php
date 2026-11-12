<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained()->cascadeOnDelete();
            $table->morphs('author');
            $table->string('profile');
            $table->string('file_name');
            $table->string('status')->default('draft');
            $table->longText('source_text');
            $table->json('data');
            $table->json('issues');
            $table->uuid('onec_ref_key')->nullable();
            $table->string('onec_number')->nullable();
            $table->timestamp('written_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_drafts');
    }
};
