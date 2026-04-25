# NetBilling ISP Management System (Monorepo)

Sistem manajemen dan billing ISP terintegrasi dengan visualisasi jaringan peta dan manajemen Mikrotik.

## Struktur Proyek
- `/isp-billing-frontend`: Aplikasi React (Vite + Tailwind).
- `/isp-billing-backend`: API Server (Laravel 11).
- `docker-compose.yml`: Konfigurasi orkestrasi full-stack.

---

## 🚀 Panduan Migrasi & Setup (PENTING untuk Partner)

Jika sebelumnya Anda bekerja hanya di folder `isp-billing-frontend`, ikuti langkah ini untuk menyesuaikan dengan struktur baru:

### 1. Bersihkan Container Lama
Buka terminal dan hapus container yang mungkin berkonflik nama:
```powershell
docker rm -f billing-db billing-frontend billing-backend
```

### 2. Persiapkan Environment Backend
Masuk ke folder `isp-billing-backend`, copy file `.env.example` menjadi `.env`:
```powershell
cp .env.example .env
```
*Konfigurasi DB di .env sudah disesuaikan untuk Docker:*
```env
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=billing_db
DB_USERNAME=root
DB_PASSWORD=root
```

### 3. Jalankan Sistem dengan Docker
Kembali ke folder utama (root), lalu jalankan:
```powershell
docker compose up -d --build
```

### 4. Jalankan Migrasi Database
Setelah container jalan, jalankan migrasi untuk backend:
```powershell
docker exec -it billing-backend php artisan migrate
```

---

## 🛠️ Perintah Berguna

| Perintah | Deskripsi |
| :--- | :--- |
| `docker compose up -d` | Menjalankan seluruh sistem di background. |
| `docker compose down` | Menghentikan semua layanan. |
| `docker exec -it billing-backend sh` | Masuk ke terminal server Backend. |
| `docker logs -f billing-backend` | Melihat log error Backend secara live. |
| `docker logs -f billing-frontend` | Melihat log Frontend. |

---

## Akses Aplikasi
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Database**: localhost:3306 (User: root, Pass: root)
