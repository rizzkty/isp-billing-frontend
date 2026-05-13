<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('xendit_invoice_id')->nullable()->after('notes');
            $table->text('xendit_payment_url')->nullable()->after('xendit_invoice_id');
            $table->string('xendit_status')->nullable()->after('xendit_payment_url'); // PENDING, PAID, EXPIRED, FAILED
            $table->timestamp('xendit_paid_at')->nullable()->after('xendit_status');
            $table->string('payment_method')->nullable()->after('xendit_paid_at'); // bank_transfer, qris, ovo, gopay, dst
            $table->timestamp('xendit_expires_at')->nullable()->after('payment_method');

            $table->index('xendit_invoice_id');
            $table->index('xendit_status');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['xendit_invoice_id']);
            $table->dropIndex(['xendit_status']);
            $table->dropColumn([
                'xendit_invoice_id',
                'xendit_payment_url',
                'xendit_status',
                'xendit_paid_at',
                'payment_method',
                'xendit_expires_at',
            ]);
        });
    }
};
