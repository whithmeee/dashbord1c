<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('integration_id')->nullable()->after('chat_id')->constrained()->cascadeOnDelete();
            $table->index('created_at');
        });

        DB::table('messages')->update([
            'integration_id' => DB::raw('(select integration_id from chats where chats.id = messages.chat_id)'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropConstrainedForeignId('integration_id');
        });
    }
};
