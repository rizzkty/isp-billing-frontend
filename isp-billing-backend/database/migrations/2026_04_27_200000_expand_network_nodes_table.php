<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ubah enum type agar konsisten dengan frontend
        DB::statement("ALTER TABLE network_nodes MODIFY COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'odp'");

        Schema::table('network_nodes', function (Blueprint $table) {
            $table->string('status', 20)->default('aktif')->after('description');
            $table->unsignedBigInteger('parent_id')->nullable()->after('status');
            $table->unsignedBigInteger('customer_id')->nullable()->after('parent_id');
            $table->string('cable_color', 20)->nullable()->after('customer_id');
            $table->string('port', 20)->nullable()->after('cable_color');

            $table->foreign('parent_id')->references('id')->on('network_nodes')->onDelete('set null');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
        });

        // Remap existing 'Pole' -> 'odc'
        DB::table('network_nodes')->where('type', 'Pole')->update(['type' => 'odc']);
        DB::table('network_nodes')->where('type', 'OLT')->update(['type' => 'server']);
        DB::table('network_nodes')->where('type', 'ODP')->update(['type' => 'odp']);
    }

    public function down(): void
    {
        Schema::table('network_nodes', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['status', 'parent_id', 'customer_id', 'cable_color', 'port']);
        });

        DB::table('network_nodes')->where('type', 'odc')->update(['type' => 'Pole']);
        DB::table('network_nodes')->where('type', 'server')->update(['type' => 'OLT']);
        DB::table('network_nodes')->where('type', 'odp')->update(['type' => 'ODP']);
        DB::statement("ALTER TABLE network_nodes MODIFY COLUMN `type` ENUM('OLT','ODP','Pole') NOT NULL DEFAULT 'ODP'");
    }
};
