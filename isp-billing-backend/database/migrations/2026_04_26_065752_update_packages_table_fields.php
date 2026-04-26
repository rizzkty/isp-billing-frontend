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
        Schema::table('packages', function (Blueprint $table) {
            $table->integer('download')->default(0)->after('speed');
            $table->integer('upload')->default(0)->after('download');
            $table->string('profile')->nullable()->after('upload');
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif')->after('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn(['download', 'upload', 'profile', 'status']);
        });
    }
};
