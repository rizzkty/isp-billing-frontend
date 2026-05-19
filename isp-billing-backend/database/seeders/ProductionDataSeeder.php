<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Package;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Ticket;
use App\Models\NetworkNode;
use App\Models\NetworkEdge;
use App\Models\AuditLog;
use App\Models\Notification;

class ProductionDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder truncates all transaction/demo tables to ensure a clean slate for production.
     */
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        NetworkEdge::truncate();
        NetworkNode::truncate();
        Ticket::truncate();
        Invoice::truncate();
        Customer::truncate();
        Package::truncate();
        AuditLog::truncate();
        Notification::truncate();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
