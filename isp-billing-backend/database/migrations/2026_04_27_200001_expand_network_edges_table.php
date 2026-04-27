<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('network_edges', function (Blueprint $table) {
            $table->string('cable_color', 20)->nullable()->after('type');
            $table->string('label')->nullable()->after('cable_color');
        });
    }

    public function down(): void
    {
        Schema::table('network_edges', function (Blueprint $table) {
            $table->dropColumn(['cable_color', 'label']);
        });
    }
};
