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
        Schema::create('olt_devices', function (Blueprint $table) {
    $table->id();

    $table->string('name');
    $table->string('ip_address');

    $table->string('username')->nullable();
    $table->text('password')->nullable();

    $table->enum('protocol', [
        'ssh',
        'snmp'
    ])->default('ssh');

    $table->string('snmp_community')
        ->nullable();

    $table->enum('olt_type', [
        'vsol_epon',
        'vsol_gpon'
    ]);

    $table->integer('polling_interval')
        ->default(30);

    $table->enum('status', [
        'online',
        'offline'
    ])->default('offline');

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('olt_devices');
    }
};
