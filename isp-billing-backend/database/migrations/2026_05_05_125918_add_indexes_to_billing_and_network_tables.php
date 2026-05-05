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
        Schema::table('customers', function (Blueprint $table) {
            $table->index('status');
            $table->index('phone');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['customer_id', 'status']);
            $table->index('due_date');
        });

        Schema::table('network_nodes', function (Blueprint $table) {
            $table->index('parent_id');
            $table->index('type');
        });

        Schema::table('network_edges', function (Blueprint $table) {
            $table->index(['from_node_id', 'to_node_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['phone']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['customer_id', 'status']);
            $table->dropIndex(['due_date']);
        });

        Schema::table('network_nodes', function (Blueprint $table) {
            $table->dropIndex(['parent_id']);
            $table->dropIndex(['type']);
        });

        Schema::table('network_edges', function (Blueprint $table) {
            $table->dropIndex(['from_node_id', 'to_node_id']);
        });
    }
};
