# USER STORIES - NetBilling ISP Management System

## Daftar Isi
1. [Authentication & User Management](#1-authentication--user-management)
2. [Dashboard](#2-dashboard)
3. [Customer Management](#3-customer-management)
4. [Billing & Invoicing](#4-billing--invoicing)
5. [Package Management](#5-package-management)
6. [Network Topology Visualization](#6-network-topology-visualization)
7. [NOC Monitoring](#7-noc-monitoring)
8. [MikroTik Integration](#8-mikrotik-integration)
9. [RADIUS Integration](#9-radius-integration)
10. [Ticketing System](#10-ticketing-system)
11. [Notification System](#11-notification-system)
12. [Admin Dashboard & Settings](#12-admin-dashboard--settings)
13. [Audit Logging](#13-audit-logging)
14. [Reports & Analytics](#14-reports--analytics)

---

## 1. Authentication & User Management

### US-1.1: User Login
**As a** system user (Admin, Teknisi, Pemilik)  
**I want to** login dengan username dan password  
**So that** saya dapat mengakses sistem dengan akun yang aman

**Acceptance Criteria:**
- [ ] Sistem menampilkan form login dengan field username dan password
- [ ] Validasi credentials terhadap database user
- [ ] Sistem generate dan return API token (Laravel Sanctum)
- [ ] Token tersimpan di local storage browser
- [ ] Jika login gagal, tampilkan pesan error yang jelas
- [ ] Rate limiting aktif untuk mencegah brute force attack
- [ ] User dapat logout dan token menjadi invalid

---

### US-1.2: Role-Based Access Control
**As a** system administrator  
**I want to** mengatur role dan permission untuk setiap user  
**So that** hanya user dengan akses yang tepat yang dapat menggunakan fitur tertentu

**Acceptance Criteria:**
- [ ] Sistem memiliki 3 role: Pemilik, Admin, Teknisi
- [ ] Pemilik: Full access ke semua fitur
- [ ] Admin: Akses ke manajemen customer, billing, settings (kecuali audit logs super admin)
- [ ] Teknisi: Akses terbatas ke support, network management, monitoring
- [ ] Setiap endpoint API memiliki middleware authorization
- [ ] Tampilkan pesan akses ditolak jika user tidak memiliki permission
- [ ] Frontend hide/disable menu items berdasarkan role user

---

### US-1.3: View Current User Profile
**As a** any authenticated user  
**I want to** melihat informasi profil user yang sedang login  
**So that** saya tahu user mana yang sedang menggunakan sistem

**Acceptance Criteria:**
- [ ] Endpoint `/api/user` return user info (name, role, username)
- [ ] Info user ditampilkan di navigation bar/header
- [ ] Display nama user dan role badge

---

### US-1.4: User Logout
**As a** any authenticated user  
**I want to** logout dari sistem  
**So that** session saya berakhir dan token menjadi invalid

**Acceptance Criteria:**
- [ ] Tombol logout tersedia di interface
- [ ] Endpoint `/api/logout` revoke API token
- [ ] Local storage token dihapus dari browser
- [ ] User redirect ke halaman login
- [ ] Session user lama tidak dapat digunakan

---

## 2. Dashboard

### US-2.1: View Dashboard Overview
**As a** admin atau pemilik  
**I want to** melihat overview sistem dengan key metrics  
**So that** saya dapat memonitor kesehatan bisnis secara real-time

**Acceptance Criteria:**
- [ ] Dashboard menampilkan 4 metric cards utama:
  - Total customer vs active customer
  - Monthly revenue (IDR)
  - Pending payments
  - Total packages
- [ ] Data real-time dari database
- [ ] Metric cards menampilkan number dengan formatting IDR untuk rupiah
- [ ] Loading state ditampilkan saat data di-fetch

---

### US-2.2: View 6-Month Revenue Trend Chart
**As a** admin atau pemilik  
**I want to** melihat grafik revenue 6 bulan terakhir  
**So that** saya dapat menganalisis trend pendapatan bisnis

**Acceptance Criteria:**
- [ ] Chart tipe bar dengan 6 bulan terakhir
- [ ] X-axis: Bulan (format: Jan, Feb, Mar, dst)
- [ ] Y-axis: Revenue dalam IDR
- [ ] Data diambil dari invoice yang sudah dibayar (status = paid)
- [ ] Tooltip menampilkan nilai exact saat hover
- [ ] Chart responsive dan mobile-friendly

---

### US-2.3: View Recent Activities
**As a** admin  
**I want to** melihat recent transactions (invoice generation/payments)  
**So that** saya dapat track activity bisnis terbaru

**Acceptance Criteria:**
- [ ] Tampilkan list recent activities (max 10 items)
- [ ] Setiap item menampilkan: timestamp, customer name, action, amount
- [ ] Activities termasuk: invoice generation, payment verification
- [ ] Sortir dari newest ke oldest
- [ ] Timestamp dalam format "X hours ago" atau full date

---

### US-2.4: Quick Action Buttons
**As a** admin  
**I want to** quick access ke main features dari dashboard  
**So that** saya dapat lebih cepat ke fitur yang sering digunakan

**Acceptance Criteria:**
- [ ] Tombol "Add Customer" navigate ke customer creation
- [ ] Tombol "Generate Invoices" navigate ke billing page
- [ ] Tombol "View Reports" navigate ke reports section
- [ ] Tombol "View Network Map" navigate ke network visualization

---

## 3. Customer Management

### US-3.1: Create New Customer
**As an** admin  
**I want to** membuat record customer baru  
**So that** saya dapat menambah subscriber baru ke sistem

**Acceptance Criteria:**
- [ ] Form menampilkan field:
  - Customer ID/Number (unique)
  - Full Name (required)
  - Phone Number (encrypted, required)
  - Email Address (encrypted)
  - Street Address (encrypted)
  - IP Address (required, unique)
  - Latitude, Longitude (auto-populate dari map click)
  - Equipment: ONT Brand, Router Brand
  - Installation Date
  - Package (dropdown, required)
  - Status (Active/Suspended)
- [ ] Validasi: customer_id harus unique, format email valid
- [ ] Phone number auto-format (0/8 -> +62)
- [ ] Success message & redirect ke detail customer
- [ ] Data encrypted before storage di database (phone, email, address)

---

### US-3.2: View Customer List
**As an** admin atau teknisi  
**I want to** melihat list semua customer dengan search & filter  
**So that** saya dapat cari customer specific dan manage mereka

**Acceptance Criteria:**
- [ ] Tampilkan table dengan column: ID, Name, Status, Package, Phone
- [ ] Pagination dengan default 20 items per page
- [ ] Search by customer ID, name, phone
- [ ] Filter by status (Active, Suspended, Isolated)
- [ ] Filter by package
- [ ] Sorting by column (Name, Status, ID)
- [ ] Action buttons: View, Edit, Delete (with confirmation)
- [ ] Bulk actions: Select multiple, change status, delete

---

### US-3.3: View Customer Details
**As an** admin  
**I want to** melihat detail lengkap customer specific  
**So that** saya dapat melihat profile, history, dan informasi terkait

**Acceptance Criteria:**
- [ ] Detail customer menampilkan:
  - Profile: Name, ID, Phone, Email, Address (decrypted)
  - Equipment: ONT, Router, Installation Date
  - Location: Lat/Lng, Map view
  - Service: Current Package, Speed Profile, Status
  - Billing Summary: Last invoice, due amount, payment status
  - Recent Invoices: List invoice terakhir
  - Ticket History: Support tickets terkait customer
- [ ] Tabs untuk organize info (Profile, Invoices, Tickets, History)
- [ ] Action buttons: Edit, Send Message, Generate Invoice, Suspend

---

### US-3.4: Edit Customer Information
**As an** admin  
**I want to** mengubah data customer yang sudah ada  
**So that** saya dapat update informasi yang berubah (address, package, etc)

**Acceptance Criteria:**
- [ ] Edit form pre-populated dengan data saat ini
- [ ] Semua field pada create form editable
- [ ] Validasi sama seperti create
- [ ] Success message & return ke customer list
- [ ] Changes logged dalam audit log

---

### US-3.5: Suspend Customer Service
**As an** admin  
**I want to** suspend service customer  
**So that** customer tidak dapat menggunakan koneksi sampai bayar

**Acceptance Criteria:**
- [ ] Button "Suspend" di customer detail atau list
- [ ] Confirmation dialog sebelum suspend
- [ ] Status berubah menjadi "Suspended"
- [ ] Trigger auto-isolir untuk add IP ke blacklist MikroTik
- [ ] Audit log entry created
- [ ] Success notification

---

### US-3.6: Reactivate Customer Service
**As an** admin  
**I want to** reactivate service customer yang suspended  
**So that** customer dapat kembali menggunakan koneksi

**Acceptance Criteria:**
- [ ] Button "Reactivate" di customer dengan status Suspended
- [ ] Status berubah menjadi "Active"
- [ ] Trigger removal dari isolation list MikroTik
- [ ] Audit log entry
- [ ] Success notification

---

### US-3.7: Send Message to Customer
**As an** admin  
**I want to** send pesan WhatsApp/Email ke customer  
**So that** saya dapat communicate penting info seperti invoices, reminders, etc

**Acceptance Criteria:**
- [ ] Modal atau page untuk compose message
- [ ] Message template selection (optional)
- [ ] Preview message sebelum send
- [ ] Channel selection: WhatsApp only, Email only, atau Both
- [ ] Send button trigger background job
- [ ] Success notification & message logged
- [ ] Support variable substitution: {{nama}}, {{paket}}, {{nominal}}

---

### US-3.8: Delete Customer
**As an** admin  
**I want to** delete customer record dari sistem  
**So that** saya dapat remove inactive atau test customer

**Acceptance Criteria:**
- [ ] Delete button dengan warning dialog
- [ ] Confirmation ask untuk confirm delete
- [ ] Related data handling: soft delete atau hard delete dengan cascade
- [ ] Audit log entry
- [ ] Customer removed dari list
- [ ] Success notification

---

## 4. Billing & Invoicing

### US-4.1: Generate Monthly Invoices
**As an** admin  
**I want to** auto-generate invoices untuk semua active customer  
**So that** saya dapat issue monthly billing otomatis

**Acceptance Criteria:**
- [ ] Button "Generate Invoices" di billing page atau dashboard
- [ ] Generate invoices untuk current month
- [ ] Hanya untuk customer dengan status "Active"
- [ ] Invoice amount = customer package price
- [ ] Set due date ke akhir bulan atau +30 hari
- [ ] Status default = "Unpaid"
- [ ] Bulk operation: process semua customer dalam 1 click
- [ ] Success message: "Generated X invoices"
- [ ] Avoid duplicate: cek jika invoice sudah ada untuk bulan ini

---

### US-4.2: View Invoice List
**As an** admin atau pemilik  
**I want to** melihat list semua invoices  
**So that** saya dapat monitor billing status

**Acceptance Criteria:**
- [ ] Table dengan column: Invoice #, Customer, Amount, Status, Due Date, Month/Year
- [ ] Pagination dengan default 20 items per page
- [ ] Filter by status (Unpaid, Paid, Cancelled)
- [ ] Filter by month/year
- [ ] Filter by customer
- [ ] Sorting by column (Date, Amount, Status)
- [ ] Color indicator: Red (Unpaid), Green (Paid), Gray (Cancelled)
- [ ] Action buttons: View, Print/Download PDF, Verify Payment, Cancel

---

### US-4.3: View Invoice Details
**As an** admin  
**I want to** melihat detail invoice specific  
**So that** saya dapat verify jumlah dan status pembayaran

**Acceptance Criteria:**
- [ ] Display invoice information:
  - Invoice number, date, due date
  - Customer details (name, ID, address)
  - Service package & description
  - Amount in IDR format
  - Status badge
  - Paid date (jika sudah dibayar)
  - Payment method (jika recorded)
  - Notes/memo
- [ ] Buttons: Print/PDF, Verify Payment, Cancel Invoice, Send Receipt
- [ ] Show customer payment history (last 5 payments)

---

### US-4.4: Verify Invoice Payment
**As an** admin  
**I want to** mark invoice sebagai "Paid" setelah verify pembayaran  
**So that** payment record terupdate dan customer terlihat up-to-date

**Acceptance Criteria:**
- [ ] Modal/form untuk verify payment
- [ ] Fields: Payment date, Payment method (Bank transfer, Cash, E-wallet, etc)
- [ ] Optional: Reference number, receipt file upload
- [ ] Validasi: payment date tidak bisa di future
- [ ] Status berubah dari "Unpaid" ke "Paid"
- [ ] Paid date recorded
- [ ] Audit log entry
- [ ] Success notification
- [ ] Trigger: if customer previously suspended, show option to reactivate

---

### US-4.5: Download Invoice as PDF
**As an** admin atau customer  
**I want to** download invoice dalam format PDF  
**So that** saya dapat save, print, atau share ke customer

**Acceptance Criteria:**
- [ ] PDF include: invoice number, date, customer details, service, amount
- [ ] Professional format dengan logo/header
- [ ] Include payment instructions
- [ ] Due date highlighted
- [ ] Payment confirmation area (untuk print & bayar)
- [ ] Download automatically atau preview in new tab
- [ ] File naming: invoice_[INVOICENO]_[CUSTOMERNAME].pdf

---

### US-4.6: Send Invoice Receipt
**As an** admin  
**I want to** send verified payment receipt ke customer via WhatsApp/Email  
**So that** customer dapat confirmation pembayaran mereka

**Acceptance Criteria:**
- [ ] Button "Send Receipt" saat invoice status Paid
- [ ] Channel selection: WhatsApp atau Email
- [ ] Message template pre-populated dengan invoice details
- [ ] Include amount, payment date, thank you message
- [ ] Trigger background job untuk send
- [ ] Audit log entry
- [ ] Success notification

---

### US-4.7: Cancel Invoice
**As an** admin  
**I want to** cancel invoice yang error atau sudah dibuat  
**So that** saya dapat fix mistake atau billing issues

**Acceptance Criteria:**
- [ ] Button "Cancel" untuk invoice dengan status "Unpaid"
- [ ] Confirmation dialog
- [ ] Status berubah ke "Cancelled"
- [ ] Optional: reason for cancellation field
- [ ] Audit log entry
- [ ] Success notification

---

### US-4.8: View Financial Dashboard
**As a** pemilik atau admin  
**I want to** lihat financial summary: monthly revenue, pending payments  
**So that** saya dapat monitor business financial health

**Acceptance Criteria:**
- [ ] Display metric cards:
  - Total monthly revenue (sum of paid invoices current month)
  - Pending payments (sum of unpaid invoices)
  - Overdue amount (unpaid invoices past due date)
  - Collection rate (% paid vs total)
- [ ] 6-month revenue trend chart
- [ ] Breakdown by payment status (pie chart: paid vs unpaid)
- [ ] Top customers by revenue
- [ ] Data real-time atau update setiap jam

---

## 5. Package Management

### US-5.1: Create Service Package
**As an** admin  
**I want to** create baru service package dengan pricing dan speed  
**So that** saya dapat offer different service tier ke customer

**Acceptance Criteria:**
- [ ] Form dengan fields:
  - Package name (required, unique)
  - Speed (Mbps, required)
  - Download limit (optional)
  - Upload limit (optional)
  - Monthly price (IDR, required)
  - MikroTik profile reference (optional)
  - Description (optional)
  - Status (Active/Inactive)
- [ ] Validation: name unique, price > 0, speed > 0
- [ ] Success message & return ke package list
- [ ] Audit log entry

---

### US-5.2: View Package List
**As an** admin  
**I want to** melihat list semua packages dengan pricing  
**So that** saya dapat manage packages dan understand offering

**Acceptance Criteria:**
- [ ] Table dengan column: Name, Speed, Price, Status, Customer Count
- [ ] Filter by status (Active/Inactive)
- [ ] Sorting by name, price, speed
- [ ] Search by name
- [ ] Action buttons: View, Edit, Delete
- [ ] Show how many customers subscribed ke each package

---

### US-5.3: Edit Package Details
**As an** admin  
**I want to** modify package information  
**So that** saya dapat update pricing atau specifications

**Acceptance Criteria:**
- [ ] Edit form pre-populated dengan current data
- [ ] Fields editable: name, speed, limits, price, description, status
- [ ] Validation sama seperti create
- [ ] Warning: changes akan affect future billing
- [ ] Success message
- [ ] Audit log entry

---

### US-5.4: Deactivate Package
**As an** admin  
**I want to** deactivate package agar tidak dapat dipilih untuk customer baru  
**So that** saya dapat maintain legacy packages tanpa bikin bingung

**Acceptance Criteria:**
- [ ] Status berubah ke "Inactive"
- [ ] Existing customer tetap punya package tersebut
- [ ] Package tidak muncul di dropdown saat create/edit customer (optional filter)
- [ ] Audit log entry

---

### US-5.5: Delete Package
**As an** admin  
**I want to** delete package yang tidak digunakan  
**So that** saya dapat clean up package list

**Acceptance Criteria:**
- [ ] Delete button dengan warning
- [ ] Validation: cannot delete jika ada customer dengan package ini
- [ ] Show error message jika ada dependency
- [ ] Success message setelah delete
- [ ] Audit log entry

---

## 6. Network Topology Visualization

### US-6.1: View Network Map
**As a** teknisi atau admin  
**I want to** visualize infrastruktur jaringan ISP di interactive map  
**So that** saya dapat understand network topology dan customer locations

**Acceptance Criteria:**
- [ ] Interactive Leaflet.js map display
- [ ] Pin/marker untuk setiap node:
  - Server (core infrastructure)
  - ODC (Optical Distribution Cabinet)
  - ODP (Optical Distribution Point)
  - Customer (end-user connection)
- [ ] Different icon/color untuk setiap node type
- [ ] Status indicator: Online (green), Warning (yellow), Offline (red)
- [ ] Click marker show popup dengan node details
- [ ] Edge lines connecting nodes (Backbone = thick, Distribution = thin)
- [ ] Cable color coding untuk visual distinction
- [ ] Zoom, pan, search functionality
- [ ] Map centered ke region utama

---

### US-6.2: View Node Details
**As a** teknisi  
**I want to** click node di map dan lihat detail lengkap  
**So that** saya dapat check node information dan status

**Acceptance Criteria:**
- [ ] Click marker show popup/modal dengan:
  - Node name, type, status
  - Latitude, longitude
  - Parent node (jika ada)
  - Connected edges/cables
  - Capacity (untuk ODP: max ports, used ports)
  - Last status update time
  - Action buttons: Edit, Delete
- [ ] For customer nodes: show customer name, package, IP
- [ ] For ODP nodes: show capacity warning jika near max
- [ ] Popup closable by clicking X atau clicking elsewhere

---

### US-6.3: Add Network Node
**As a** teknisi atau admin  
**I want to** add node baru ke network topology  
**So that** saya dapat document network infrastructure

**Acceptance Criteria:**
- [ ] Form atau dialog untuk create node
- [ ] Fields:
  - Node name (required)
  - Node type (dropdown: Server/ODC/ODP/Customer)
  - Latitude (required, dari map click)
  - Longitude (required, dari map click)
  - Parent node (dropdown, optional)
  - Status (Online/Warning/Offline)
  - For ODP: max_ports (capacity)
  - For customer: associate customer_id, equipment brand
- [ ] Option to click map untuk select coordinates
- [ ] Validation: unique name dalam region
- [ ] Success & node appear di map
- [ ] Audit log entry

---

### US-6.4: Edit Network Node
**As a** teknisi  
**I want to** modify node information  
**So that** saya dapat update node details atau fix errors

**Acceptance Criteria:**
- [ ] Edit form pre-populated dengan current data
- [ ] Editable fields: name, type, parent, status, coordinates
- [ ] Option to change map location
- [ ] Validation sama seperti create
- [ ] Success message
- [ ] Node updated di map realtime
- [ ] Audit log entry

---

### US-6.5: Delete Network Node
**As a** teknisi  
**I want to** delete node yang tidak digunakan  
**So that** saya dapat clean up topology

**Acceptance Criteria:**
- [ ] Delete button dengan warning
- [ ] Validation: cannot delete jika ada dependent edges atau child nodes
- [ ] Show error message jika ada dependency
- [ ] Confirm dialog
- [ ] Node removed dari map
- [ ] Audit log entry

---

### US-6.6: Add Network Edge (Connection)
**As a** teknisi  
**I want to** create connection/edge antar nodes  
**So that** saya dapat represent cable connections di network

**Acceptance Criteria:**
- [ ] Form untuk add edge:
  - From node (dropdown)
  - To node (dropdown)
  - Edge type (Backbone/Distribution)
  - Cable color (visual distinction)
  - Label (optional: cable info, distance)
- [ ] Alternative: click node, then click another node to create edge
- [ ] Validation: cannot create duplicate edge, from != to
- [ ] Edge line appear di map dengan appropriate styling
- [ ] Success notification
- [ ] Audit log entry

---

### US-6.7: View Network Statistics
**As a** admin  
**I want to** lihat summary network topology  
**So that** saya dapat understand network scale dan capacity

**Acceptance Criteria:**
- [ ] Display stats:
  - Total nodes (by type: server, ODC, ODP, customer)
  - Total edges
  - Total capacity (sum of all ODP max_ports)
  - Utilization rate (% of ODP capacity used)
  - Network health (% online nodes)
- [ ] Alerts: highlight critical items (full ODP, offline nodes)

---

## 7. NOC Monitoring

### US-7.1: View Live System Statistics
**As a** NOC operator  
**I want to** monitor live system statistics dari MikroTik  
**So that** saya dapat watch system health real-time

**Acceptance Criteria:**
- [ ] Live dashboard menampilkan:
  - CPU load % (real-time)
  - Router uptime (formatted human-readable)
  - System logs (last 10 entries, auto-refresh)
- [ ] Polling interval: 3 seconds untuk update
- [ ] Color coding: green (<70% CPU), yellow (70-85%), red (>85%)
- [ ] Uptime format: "45 days, 3 hours, 20 minutes"
- [ ] Logs show timestamp, message, level
- [ ] Auto-refresh toggle (on/off)
- [ ] Manual refresh button

---

### US-7.2: Monitor ISP Traffic
**As a** NOC operator  
**I want to** monitor real-time bandwidth usage dari 2 ISP links  
**So that** saya dapat identify congestion dan manage traffic

**Acceptance Criteria:**
- [ ] Display 2 ISP traffic cards (ISP1, ISP2):
  - Current TX (upload) Mbps
  - Current RX (download) Mbps
  - Peak usage in last hour
  - Average usage in last hour
- [ ] Visual indicator: green (<50% capacity), yellow (50-80%), red (>80%)
- [ ] Traffic trend chart: last 20 polling cycles (1 minute history)
  - 2 lines: TX (up), RX (down)
  - Sparkline format atau mini chart
- [ ] Polling interval: 3 seconds
- [ ] X-axis: time labels (5-minute intervals)
- [ ] Y-axis: Mbps scale

---

### US-7.3: Monitor RADIUS Active Sessions
**As a** NOC operator  
**I want to** see active user connections via RADIUS  
**So that** saya dapat verify customers online dan track usage

**Acceptance Criteria:**
- [ ] Table/list active RADIUS sessions:
  - Username
  - NAS IP (access point/router)
  - Framed IP (customer IP address)
  - MAC address (Calling Station ID)
  - Session duration (start time to now)
  - Upload bytes (human-readable: MB, GB)
  - Download bytes (human-readable: MB, GB)
- [ ] Total session count & aggregate bandwidth
- [ ] Auto-refresh every 3 seconds
- [ ] Sort by username, IP, duration, or bytes
- [ ] Search/filter by username atau IP
- [ ] Indicate customer detail on hover (name, package)

---

### US-7.4: Manage Device Alarms
**As a** NOC operator  
**I want to** see dan manage device status alarms  
**So that** saya dapat respond quickly ke network issues

**Acceptance Criteria:**
- [ ] Alarm list showing:
  - Device name (ODP/Server/ODC)
  - Status (Online, Warning, Offline)
  - Last change time
  - Issue description (optional notes)
  - Severity (Critical, High, Medium, Low)
- [ ] Color coding per severity
- [ ] Filter by severity, status
- [ ] Acknowledge alarm (mark as reviewed)
- [ ] Dismiss alarm atau snooze untuk period tertentu
- [ ] History of alarm state changes
- [ ] Trigger action: send notification atau run job

---

### US-7.5: View ODP Capacity Alerts
**As a** NOC operator  
**I want to** get warned jika ODP capacity penuh atau hampir penuh  
**So that** saya dapat plan expansion atau offload customers

**Acceptance Criteria:**
- [ ] Alert list menampilkan ODP dengan:
  - ODP name
  - Current utilization (X/Y ports used)
  - Utilization % with progress bar
  - Recommended action (add ports, balance customers, etc)
- [ ] Color code: green (<70%), yellow (70-85%), red (>85%)
- [ ] Sort by utilization %
- [ ] Blast radius indicator: show potential customer impact jika ODP fail
- [ ] Click untuk detail & see connected customers

---

### US-7.6: NOC Demo Mode (No MikroTik Required)
**As a** developer atau tester  
**I want to** test NOC features tanpa MikroTik connection  
**So that** saya dapat develop/test without production infrastructure

**Acceptance Criteria:**
- [ ] Detect MikroTik connection failure
- [ ] Fall back ke demo/mock data
- [ ] Display demo indicator di UI
- [ ] Mock data update dengan interval sama seperti real
- [ ] All NOC features work dengan mock data
- [ ] Tidak show error messages, appear normal
- [ ] Can toggle demo mode di settings

---

## 8. MikroTik Integration

### US-8.1: Configure MikroTik API Connection
**As an** admin  
**I want to** setup MikroTik API credentials  
**So that** system dapat connect ke router untuk monitoring dan management

**Acceptance Criteria:**
- [ ] Settings page dengan form:
  - API IP address (required)
  - API port (default 8728)
  - Username (required)
  - Password (required, encrypted storage)
  - Connection timeout (optional, default 3 seconds)
  - Enable/Disable toggle
- [ ] Save button
- [ ] Validation: IP valid format, port is number
- [ ] Password shown as dots, mask input
- [ ] Success message on save
- [ ] Audit log entry dengan "MikroTik config updated" (no password logged)

---

### US-8.2: Test MikroTik API Connection
**As an** admin  
**I want to** test MikroTik API connection sebelum save  
**So that** saya validate credentials dan connectivity work

**Acceptance Criteria:**
- [ ] "Test Connection" button di settings form
- [ ] Attempt connect ke MikroTik dengan provided credentials
- [ ] Return router identity (name, version, board)
- [ ] Show success message dengan router info
- [ ] Show error message jika connection fail (timeout, auth error, etc)
- [ ] Don't proceed save jika test fail (atau warn user)
- [ ] Loading indicator during test

---

### US-8.3: Monitor MikroTik Interface Traffic
**As a** NOC operator  
**I want to** monitor traffic per interface (ISP1, ISP2, etc)  
**So that** saya dapat see per-link bandwidth usage

**Acceptance Criteria:**
- [ ] Query MikroTik interface statistics
- [ ] Display traffic untuk setiap ISP interface:
  - Interface name
  - Current RX Mbps
  - Current TX Mbps
  - Peak RX/TX (last hour)
  - Average RX/TX (last hour)
  - Total RX/TX bytes (lifetime)
- [ ] Polling interval: 3 seconds
- [ ] Color indicator per traffic level

---

### US-8.4: Auto-Isolir: Automatic Customer Isolation
**As an** admin  
**I want to** auto-isolate non-paying customers ke firewall list  
**So that** they cannot access internet (bandwidth limit) until payment

**Acceptance Criteria:**
- [ ] Process:
  1. Query overdue invoices (payment due date passed)
  2. Get customer IP addresses
  3. Add IPs ke MikroTik firewall address-list named "ISOLIR_LIST"
  4. Remove dari list jika invoice becomes paid
- [ ] Can trigger manually via button "Run Auto-Isolir Now"
- [ ] Can schedule auto-run (e.g., daily at midnight)
- [ ] Show processing status: loading, progress bar, done
- [ ] Log isolation action: which customer isolated, timestamp
- [ ] Success notification: "X customers isolated"
- [ ] Error handling: show failed isolations
- [ ] Option to exclude customers (whitelist)

---

### US-8.5: Auto-Isolir: Manual Trigger
**As an** admin  
**I want to** manually trigger auto-isolir process anytime  
**So that** saya dapat immediately isolate delinquent customers

**Acceptance Criteria:**
- [ ] Button "Run Auto-Isolir Now" di main dashboard atau settings
- [ ] Show confirmation dialog: "This will isolate overdue customers"
- [ ] Trigger background job (RunAutoIsolirJob)
- [ ] Show progress: "Processing... 45/100 customers"
- [ ] Show results: "Isolated: 45, Updated: 5, Errors: 2"
- [ ] Log audit: who triggered, when, results
- [ ] Toast notification with results

---

### US-8.6: View Isolation History
**As an** admin  
**I want to** see history of which customers isolated dan when  
**So that** saya dapat track isolation actions

**Acceptance Criteria:**
- [ ] Page menampilkan table:
  - Customer name, ID
  - Date isolated
  - Reason (invoice overdue, manual action, etc)
  - Status (Isolated, Released)
  - Date released (if any)
- [ ] Filter by status
- [ ] Sort by date
- [ ] Search by customer
- [ ] Action: manually remove dari isolation list

---

## 9. RADIUS Integration

### US-9.1: Configure RADIUS Database Connection
**As an** admin  
**I want to** setup FreeRADIUS database connection  
**So that** system dapat query active user sessions

**Acceptance Criteria:**
- [ ] Settings page form dengan fields:
  - Database host (required)
  - Database port (default 3306)
  - Database name (required)
  - Username (required)
  - Password (required, encrypted)
  - Connection timeout (optional, default 3 seconds)
  - Enable/Disable toggle
- [ ] Save button
- [ ] Validation: hostname valid, port is number
- [ ] Password masked input
- [ ] Success notification
- [ ] Audit log entry (no password logged)

---

### US-9.2: Test RADIUS Database Connection
**As an** admin  
**I want to** test RADIUS DB connection sebelum save  
**So that** validate credentials dan connectivity work

**Acceptance Criteria:**
- [ ] "Test Connection" button
- [ ] Attempt connect ke FreeRADIUS database
- [ ] Test query: SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL
- [ ] Return active session count (e.g., "15 active sessions found")
- [ ] Show success message
- [ ] Show error if connection fail (timeout, auth, database error)
- [ ] Loading indicator during test

---

### US-9.3: View Active RADIUS Sessions
**As a** NOC operator  
**I want to** see list active user connections dari RADIUS database  
**So that** saya dapat verify customer connections dan usage

**Acceptance Criteria:**
- [ ] Table menampilkan active sessions:
  - Username (customer ID/login)
  - NAS IP (access point)
  - Framed IP (customer assigned IP)
  - MAC address (Calling Station ID) optional column
  - Session start time
  - Session duration (calculated as NOW - start time)
  - Upload octets (bytes) human-readable format (MB, GB)
  - Download octets (bytes) human-readable format
- [ ] Summary stats at top:
  - Total active sessions
  - Total bandwidth (upload + download)
  - Average session duration
- [ ] Auto-refresh every 3-5 seconds
- [ ] Sort by any column
- [ ] Filter/search by username
- [ ] Pagination jika ratusan sessions

---

### US-9.4: Monitor RADIUS Session Statistics
**As a** pemilik atau admin  
**I want to** see RADIUS analytics: active users trend, peak times  
**So that** saya dapat understand network usage pattern

**Acceptance Criteria:**
- [ ] Dashboard charts:
  - Active users count per hour (last 24 hours)
  - Peak time indicator (time dengan most sessions)
  - Total bandwidth used per hour (last 24 hours)
  - Top 10 users by data consumed (today)
- [ ] Data fetched dari RADIUS radacct table
- [ ] Charts update every hour
- [ ] Export stats as CSV atau PDF

---

## 10. Ticketing System

### US-10.1: Create Support Ticket
**As a** teknisi atau admin  
**I want to** create support ticket untuk track customer issues  
**So that** issues can be properly tracked dan resolved

**Acceptance Criteria:**
- [ ] Form dengan fields:
  - Title (required)
  - Description (required, can be long text)
  - Customer (dropdown atau search)
  - Priority (Low, Medium, High, Urgent)
  - Category (optional: Network, Billing, Hardware, etc)
- [ ] Status default: "Open"
- [ ] Assigned to field (optional): assign ke technician
- [ ] Validation: title not empty, description min 10 chars
- [ ] Success: redirect ke ticket detail
- [ ] Audit log: ticket created

---

### US-10.2: View Ticket List
**As a** admin atau teknisi  
**I want to** see list tickets dengan status filtering  
**So that** saya dapat prioritize work

**Acceptance Criteria:**
- [ ] Table dengan column: ID, Title, Customer, Status, Priority, Created Date
- [ ] Filter by status (Open, In Progress, Resolved, Closed) dengan badge count
- [ ] Filter by priority
- [ ] Filter by assigned to (Unassigned, My tickets, etc)
- [ ] Sorting by any column atau date created (newest first)
- [ ] Search by title atau ticket ID
- [ ] Pagination
- [ ] Color coding: Red (Urgent), Orange (High), Blue (Medium), Gray (Low)
- [ ] Quick action: mark resolved button

---

### US-10.3: View Ticket Details
**As a** admin  
**I want to** view ticket dengan full details dan history  
**So that** saya dapat understand issue dan track progress

**Acceptance Criteria:**
- [ ] Display:
  - Ticket ID, title, status, priority
  - Customer name, ID, contact
  - Description (full text)
  - Created by, created date
  - Assigned to (if any)
  - Activity timeline: creation, comments, status changes
  - Buttons: Edit, Assign, Change Status, Close, Delete
- [ ] Comments section: add resolution notes
- [ ] Show attachment upload (if applicable)
- [ ] Status badges dengan timeline

---

### US-10.4: Assign Ticket
**As an** admin  
**I want to** assign ticket ke specific technician  
**So that** ownership is clear dan work can be tracked

**Acceptance Criteria:**
- [ ] Dropdown atau modal untuk select technician
- [ ] Can only assign ke users dengan role Teknisi
- [ ] Assigned date recorded
- [ ] Notification sent ke assigned technician
- [ ] Audit log entry
- [ ] Success notification

---

### US-10.5: Update Ticket Status
**As a** admin atau teknisi  
**I want to** change ticket status (Open → In Progress → Resolved → Closed)  
**So that** workflow can be tracked

**Acceptance Criteria:**
- [ ] Status dropdown atau buttons
- [ ] Valid transitions: Open → In Progress, In Progress → Resolved, any → Closed
- [ ] When resolved: ask untuk resolution notes (optional)
- [ ] Status change recorded dengan timestamp
- [ ] Audit log entry
- [ ] If status = Closed: ticket archived atau soft-deleted dari list

---

### US-10.6: Add Ticket Comments/Notes
**As a** admin  
**I want to** add comments atau resolution notes ke ticket  
**So that** progress can be tracked dan documented

**Acceptance Criteria:**
- [ ] Comment box di ticket detail
- [ ] Add/submit button
- [ ] Comment stored dengan username, timestamp
- [ ] Display comments chronologically
- [ ] Each comment show: author, date, content
- [ ] Can edit/delete own comments (within time limit)
- [ ] Audit log entry

---

### US-10.7: Close Ticket
**As a** admin  
**I want to** close ticket setelah resolved  
**So that** completed work can be archived

**Acceptance Criteria:**
- [ ] Button "Close Ticket" pada ticket detail
- [ ] Confirmation dialog
- [ ] Option untuk rate satisfaction (1-5) atau feedback
- [ ] Status = "Closed"
- [ ] Closed date recorded
- [ ] Ticket removed dari active list (appear di history)
- [ ] Audit log entry

---

### US-10.8: Technician Inbox
**As a** teknisi  
**I want to** view my assigned tickets di personal inbox  
**So that** saya dapat focus sa my responsibilities

**Acceptance Criteria:**
- [ ] Page `/inbox` untuk technician
- [ ] Show only tickets assigned to current user
- [ ] Filter by status: Open, In Progress, Closed
- [ ] Sort by priority atau created date
- [ ] Count badge: "5 Open, 2 In Progress"
- [ ] Quick access ke high priority items
- [ ] Same ticket management functionality

---

## 11. Notification System

### US-11.1: Send Broadcast Notification
**As an** admin  
**I want to** send pesan ke ALL customers naively  
**So that** saya dapat communicate announcements atau promotions

**Acceptance Criteria:**
- [ ] Form untuk broadcast:
  - Title (required)
  - Message (required)
  - Channel: WhatsApp, Email, atau Both
  - Optional: select template
  - Preview (show message preview)
- [ ] Target: all active customers
- [ ] Bulk delivery via background jobs
- [ ] Show result: "Sent to 345 customers"
- [ ] Audit log entry
- [ ] Success notification

---

### US-11.2: Send Personal Notification
**As an** admin  
**I want to** send message ke specific customer atau group  
**So that** saya dapat personalize communication

**Acceptance Criteria:**
- [ ] Form similar ke broadcast, but dengan customer selection:
  - Select single customer OR
  - Select by filter: status, package, region
- [ ] Personalization variables: {{nama}}, {{paket}}, {{nominal}}
- [ ] Preview show personalized message
- [ ] Channel selection
- [ ] Send via background job
- [ ] Audit log entry

---

### US-11.3: Create Notification Template
**As an** admin  
**I want to** create reusable message templates  
**So that** saya dapat standardize communication

**Acceptance Criteria:**
- [ ] Form dengan fields:
  - Template name (required, unique)
  - Title
  - Message (required, can include variables: {{nama}}, {{paket}}, {{nominal}}, {{jatuh_tempo}})
  - Set as default (checkbox)
- [ ] Help text: show available variables
- [ ] Save button
- [ ] Success message
- [ ] Audit log entry

---

### US-11.4: View Notification Templates
**As an** admin  
**I want to** manage list templates  
**So that** saya dapat edit atau delete them

**Acceptance Criteria:**
- [ ] Table: Template name, preview, default status, action buttons
- [ ] Filter by default/custom
- [ ] Search by name
- [ ] Action: Edit, Delete, Use Now (send)
- [ ] Default template badge
- [ ] Pagination

---

### US-11.5: Edit Notification Template
**As an** admin  
**I want to** modify existing template  
**So that** saya dapat improve message content

**Acceptance Criteria:**
- [ ] Edit form pre-populated
- [ ] Same fields as create
- [ ] Change default status (if needed)
- [ ] Validation same as create
- [ ] Success notification
- [ ] Audit log entry

---

### US-11.6: Delete Notification Template
**As an** admin  
**I want to** remove unused templates  
**So that** template list stays clean

**Acceptance Criteria:**
- [ ] Delete button dengan confirmation
- [ ] Cannot delete if template being used
- [ ] Success notification
- [ ] Audit log entry

---

### US-11.7: View Notification History
**As an** admin  
**I want to** see history sent notifications  
**So that** saya dapat track communication

**Acceptance Criteria:**
- [ ] Table: Date, title, recipient count, channel, status
- [ ] Filter by channel (WhatsApp, Email)
- [ ] Filter by date range
- [ ] Search by title atau recipient
- [ ] Click untuk detail: show individual delivery status
- [ ] Sorting by date (newest first)
- [ ] Pagination

---

### US-11.8: View Notification Delivery Status
**As an** admin  
**I want to** see per-customer delivery status dari notification  
**So that** saya dapat verify pesan delivered

**Acceptance Criteria:**
- [ ] List menampilkan:
  - Customer name
  - Delivery status (Sent, Delivered, Failed, Pending)
  - Delivery time
  - Error message (if failed)
- [ ] Filter by status
- [ ] Summary: Total sent, Delivered, Failed
- [ ] Retry button untuk failed delivery
- [ ] Export as CSV

---

### US-11.9: WhatsApp Integration Preview
**As an** admin  
**I want to** preview message dalam WhatsApp format sebelum send  
**So that** saya dapat verify formatting correct

**Acceptance Criteria:**
- [ ] Preview modal menampilkan:
  - Message dalam WhatsApp-like bubble format
  - Phone number recipient
  - Simulated delivery time
- [ ] Show variable substitution result
- [ ] Option to back dan edit
- [ ] Confirm to send

---

## 12. Admin Dashboard & Settings

### US-12.1: Main Dashboard Overview
**As a** pemilik atau admin  
**I want to** landing page dengan quick overview  
**So that** immediate visibility into business status

**Acceptance Criteria:**
- [ ] Components:
  - 4 metric cards (total customers, active customers, monthly revenue, pending)
  - 6-month revenue chart
  - Recent activities list (5-10 items)
  - Quick action buttons (Add customer, Generate invoices, View reports, View network)
  - System status indicator (online, API connected, RADIUS connected)
- [ ] Responsive layout (cards stack di mobile)
- [ ] Loading skeleton atau spinner
- [ ] Data auto-refresh setiap 30 seconds

---

### US-12.2: System Settings Page
**As an** admin  
**I want to** configure application settings  
**So that** system can be customized per deployment

**Acceptance Criteria:**
- [ ] Settings form dengan sections:
  - **MikroTik Settings**: API IP, port, credentials, test button
  - **RADIUS Settings**: DB host, port, credentials, test button
  - **WhatsApp Settings**: API key, base URL, enable/disable
  - **System Settings**: Company name, timezone, currency, logo
  - **Email Settings**: SMTP configuration (optional)
- [ ] Save button
- [ ] Individual test buttons per section
- [ ] Success notification
- [ ] Validation per field
- [ ] Audit log entry

---

### US-12.3: User Management
**As a** admin  
**I want to** manage system users (staff)  
**So that** saya dapat add/remove technicians dan admins

**Acceptance Criteria:**
- [ ] User list page:
  - Table: Username, Name, Role, Status, Last login
  - Filter by role (Admin, Teknisi, Pemilik)
  - Filter by status (Active, Inactive)
  - Search by username atau name
  - Action buttons: View, Edit, Deactivate, Delete
- [ ] Create user button:
  - Form: Username, Full name, Password, Role, Status
  - Username must be unique
  - Password validation (min 8 chars, mix case, number)
- [ ] Edit user:
  - Change name, role, status
  - Force password reset option
- [ ] Delete user dengan confirmation
- [ ] Audit log entry

---

### US-12.4: View System Health
**As an** admin  
**I want to** see system health status  
**So that** identify any issues quickly

**Acceptance Criteria:**
- [ ] Display status indicators:
  - Database connection (Online, Offline)
  - MikroTik API connection (Online, Offline, Disabled)
  - RADIUS DB connection (Online, Offline, Disabled)
  - Queue job status (Enabled, Disabled, # pending jobs)
  - API response time (ms)
  - Disk space usage (%)
- [ ] Color coding: Green (ok), Yellow (warning), Red (error)
- [ ] Last check time
- [ ] Manual "Check Now" button
- [ ] Alert jika any critical component down

---

## 13. Audit Logging

### US-13.1: View Audit Logs
**As a** admin atau pemilik  
**I want to** see history semua user actions di sistem  
**So that** saya dapat track changes dan ensure compliance

**Acceptance Criteria:**
- [ ] Page menampilkan table:
  - Timestamp
  - User (username)
  - Action (login, create customer, verify payment, etc)
  - Details (what was changed, affected customer/invoice)
  - IP address
- [ ] Sorting by timestamp (newest first)
- [ ] Filter by user
- [ ] Filter by action type
- [ ] Filter by date range
- [ ] Search by keyword
- [ ] Pagination (100 items per page)
- [ ] Export as CSV

---

### US-13.2: View Detailed Audit Entry
**As a** admin  
**I want to** click audit entry untuk see full details  
**So that** understand exactly what changed

**Acceptance Criteria:**
- [ ] Modal/page menampilkan:
  - Full action details
  - Before/after values (jika applicable)
  - User info
  - IP address
  - Timestamp
  - Related entity (customer, invoice, etc)
- [ ] Link ke related entity (click to view customer detail)

---

### US-13.3: Delete Audit Log Entries
**As a** admin  
**I want to** delete old audit entries untuk housekeeping  
**So that** maintain database performance

**Acceptance Criteria:**
- [ ] Delete button: Delete individual entry atau mass delete
- [ ] Mass delete by date range: "Delete entries older than X days"
- [ ] Confirmation dialog
- [ ] Success message: "Deleted 500 entries"
- [ ] Optional: export before delete untuk archive

---

## 14. Reports & Analytics

### US-14.1: Financial Report Dashboard
**As a** pemilik  
**I want to** view comprehensive financial reports  
**So that** understand business performance

**Acceptance Criteria:**
- [ ] Report sections:
  - **Revenue Summary**: Monthly, quarterly, yearly revenue
  - **Invoice Status Breakdown**: % paid, unpaid, overdue, cancelled
  - **Collection Rate**: Paid amount vs total billed (%)
  - **Customer Value**: Average revenue per customer, top customers
  - **Forecast**: Projected revenue next 3 months based on trend
  - **Outstanding**: Total unpaid amount, overdue detail
- [ ] Charts:
  - Revenue trend (6-month bar chart)
  - Invoice status pie chart
  - Collection rate trend
  - Top customers by revenue
- [ ] Filters: Date range, package, customer segment
- [ ] Export: PDF, CSV, Excel

---

### US-14.2: Customer Analytics
**As a** admin  
**I want to** analyze customer trends dan churn  
**So that** identify business opportunity

**Acceptance Criteria:**
- [ ] Metrics:
  - Total customers, active, suspended, isolated, inactive
  - New customers (this month, this year)
  - Churn rate (% canceled)
  - Average customer lifetime value
  - Customer retention rate
- [ ] Charts:
  - Customer count trend (6-month)
  - Churn rate trend
  - Package distribution (pie chart: customers per package)
  - Geographic distribution (map visualization)
  - Customer status breakdown
- [ ] Filters: Date range, location, package

---

### US-14.3: Network Performance Report
**As a** NOC manager  
**I want to** analyze network performance metrics  
**So that** identify optimization opportunities

**Acceptance Criteria:**
- [ ] Report metrics:
  - Average uptime % (MikroTik router)
  - Peak traffic times (24-hour breakdown)
  - ISP link utilization (ISP1, ISP2)
  - Customer disconnections (count, pattern)
  - Node availability (% online)
- [ ] Charts:
  - Uptime trend (30-day)
  - Hourly traffic pattern
  - Per-ISP utilization
  - Node status distribution
- [ ] Alerts: Highlight anomalies atau SLA violations
- [ ] Filters: Time period, ISP, node type

---

### US-14.4: Export Reports
**As a** admin atau pemilik  
**I want to** export reports ke various format  
**So that** saya dapat share atau analyze di Excel

**Acceptance Criteria:**
- [ ] Export buttons: PDF, CSV, Excel
- [ ] Maintain formatting (colors, charts if applicable)
- [ ] Include metadata: export date, filtered criteria, company info
- [ ] File naming: "report_[type]_[date].pdf"
- [ ] Download automatically atau email
- [ ] Audit log: who exported, when

---

## 15. Technician Portal Features

### US-15.1: Technician Dashboard
**As a** teknisi  
**I want to** view dashboard dengan tasks relevant to me  
**So that** focus on my work responsibilities

**Acceptance Criteria:**
- [ ] Display:
  - My assigned open tickets (count badge)
  - Recent ticket activity
  - Network nodes status (for my region if applicable)
  - Quick actions: Create ticket, View network map, Check RADIUS sessions
- [ ] Simpler than admin dashboard (no revenue, no financial data)
- [ ] Links to: My tickets, Network map, NOC dashboard

---

### US-15.2: Technician Support Inbox
**As a** teknisi  
**I want to** quick access to my assigned tickets  
**So that** not miss any customer issue

**Acceptance Criteria:**
- [ ] Dedicated inbox page
- [ ] Show only assigned tickets (where assigned_to = current user)
- [ ] Filter tabs: All (25), Open (10), In Progress (5), Resolved (10)
- [ ] Tickets sorted by priority (Urgent, High, Medium, Low)
- [ ] Quick actions in list: Open, Change status, Add comment
- [ ] Notification on new assignment

---

### US-15.3: Update Ticket from Mobile/Offline
**As a** teknisi in field  
**I want to** update ticket status on mobile  
**So that** real-time update dari site

**Acceptance Criteria:**
- [ ] Mobile-responsive ticket detail page
- [ ] Touch-friendly buttons
- [ ] Offline capability: save locally, sync when online
- [ ] Add photo/attachment untuk before-after documentation
- [ ] Quick status change buttons (not dropdown)
- [ ] Add comment field with character count

---

---

# PRIORITIZATION SUMMARY

## Phase 1: MVP (Critical Features)
1. Authentication & role-based access (US-1.1, 1.2)
2. Customer management (US-3.1, 3.2, 3.3, 3.4)
3. Billing & invoicing (US-4.1, 4.2, 4.3, 4.4)
4. Dashboard overview (US-2.1)
5. Package management (US-5.1, 5.2)

## Phase 2: Core Operations
1. Network topology visualization (US-6.1 - 6.7)
2. NOC monitoring (US-7.1 - 7.5)
3. MikroTik integration (US-8.1 - 8.6)
4. Ticketing system (US-10.1 - 10.8)
5. Audit logging (US-13.1)

## Phase 3: Advanced Features
1. RADIUS integration (US-9.1 - 9.4)
2. Notification system (US-11.1 - 11.9)
3. Reports & analytics (US-14.1 - 14.4)
4. Admin settings & user management (US-12.1 - 12.4)

## Phase 4: Enhancement & Polish
1. Technician portal (US-15.1 - 15.3)
2. Advanced reporting
3. Mobile optimization
4. Performance optimization

---

**Total User Stories: 96**

**Effort Estimate:**
- Phase 1: ~4 weeks
- Phase 2: ~6 weeks
- Phase 3: ~4 weeks
- Phase 4: ~3 weeks
- **Total: ~17 weeks (4 months)**
