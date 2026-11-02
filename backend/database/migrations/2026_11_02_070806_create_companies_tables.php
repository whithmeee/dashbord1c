<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('email_verification_code_hash')->nullable();
            $table->timestamp('email_verification_code_expires_at')->nullable();
            $table->unsignedTinyInteger('email_verification_attempts')->default(0);
            $table->date('subscription_starts_at');
            $table->date('subscription_ends_at');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('company_phones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('phone');
            $table->string('label')->nullable();
            $table->timestamps();
        });

        Schema::create('company_messengers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('contact');
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('position');
            $table->string('login')->unique();
            $table->string('password');
            $table->timestamp('last_seen_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
        Schema::dropIfExists('company_messengers');
        Schema::dropIfExists('company_phones');
        Schema::dropIfExists('companies');
    }
};
