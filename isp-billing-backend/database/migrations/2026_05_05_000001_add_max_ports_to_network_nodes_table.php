<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('network_nodes', function (Blueprint $table) {
            $table->unsignedInteger('max_ports')->default(8)->after('port');
        });
    }

    public function down(): void
    {
        Schema::table('network_nodes', function (Blueprint $table) {
            $table->dropColumn('max_ports');
        });
    }
};
