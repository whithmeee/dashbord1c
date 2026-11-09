<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16);
            $table->timestamp('occurred_at');
            $table->index(['employee_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_activities');
    }
};
