<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->enum('channel', ['wa', 'email', 'both'])->default('wa')->after('type');
            $table->unsignedBigInteger('customer_id')->nullable()->after('channel');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['channel', 'customer_id']);
        });
    }
};
