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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_id')->unique(); // Contoh: NB-2024001
            $table->string('name');
            $table->text('address');
            $table->string('phone');
            $table->string('package_name'); // Sementara teks dulu sebelum ada tabel package
            $table->enum('status', ['aktif', 'nonaktif', 'terisolir'])->default('aktif');
            $table->date('installation_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
