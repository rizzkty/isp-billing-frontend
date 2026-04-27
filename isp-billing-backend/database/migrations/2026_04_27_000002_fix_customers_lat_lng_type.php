<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Ubah dari DECIMAL(10,7) ke DOUBLE agar bisa simpan koordinat GPS apapun
            $table->double('latitude')->nullable()->change();
            $table->double('longitude')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->change();
            $table->decimal('longitude', 10, 7)->nullable()->change();
        });
    }
};
