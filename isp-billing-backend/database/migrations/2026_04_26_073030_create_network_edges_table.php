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
        Schema::create('network_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_node_id')->constrained('network_nodes')->onDelete('cascade');
            $table->foreignId('to_node_id')->constrained('network_nodes')->onDelete('cascade');
            $table->enum('type', ['Backbone', 'Distribution'])->default('Distribution');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('network_edges');
    }
};
