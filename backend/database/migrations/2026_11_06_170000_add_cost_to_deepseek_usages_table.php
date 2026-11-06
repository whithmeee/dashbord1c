<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deepseek_usages', function (Blueprint $table) {
            $table->unsignedBigInteger('estimated_cost_usd_micros')->nullable()->after('total_tokens');
            $table->json('pricing_snapshot')->nullable()->after('estimated_cost_usd_micros');
        });
    }

    public function down(): void
    {
        Schema::table('deepseek_usages', function (Blueprint $table) {
            $table->dropColumn(['estimated_cost_usd_micros', 'pricing_snapshot']);
        });
    }
};
