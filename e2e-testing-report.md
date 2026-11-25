# Laporan Implementasi E2E Testing Way2Home (Playwright)

## 1. Ringkasan Eksekutif

Implementasi **End-to-End (E2E) Testing menggunakan Playwright v1.65.1** pada proyek **Way2Home (Sistem Manajemen Pembangunan Rumah)** telah berhasil dilakukan pada branch `feature/white-box-testing`.

Pengujian mencakup enam kelompok modul utama, yaitu autentikasi dan kontrol akses, katalog desain, pengajuan dan tracking proyek, portal Admin, portal Pengawas dan Mandor, serta simulasi integrasi pembayaran Midtrans menggunakan mock.

Berdasarkan eksekusi terakhir, seluruh **31 test case berhasil dijalankan tanpa kegagalan**. Pengujian ini juga dilengkapi dengan Unit Testing menggunakan Vitest untuk memverifikasi logika internal aplikasi.

| Metrik Pengujian | Hasil Aktual | Status |
|---|---:|---|
| Playwright Spec Files | 6 files | Selesai |
| E2E Test Cases | 31/31 passed | Lulus (100%) |
| E2E Test Cases Gagal | 0 | Lulus |
| Durasi Eksekusi E2E | 18,4 detik | Selesai |
| Unit Testing (Vitest) | 20 files, 205 tests passed | Lulus (100%) |
| TypeScript Compilation | 0 error | Lulus |

Hasil tersebut menunjukkan bahwa skenario pengujian E2E yang telah diimplementasikan dapat berjalan sesuai ekspektasi. Namun, keberhasilan pengujian terbatas pada skenario, data uji, dan lingkungan pengujian yang digunakan, sehingga belum dapat dianggap sebagai bukti bahwa seluruh kondisi operasional aplikasi telah tervalidasi.

---

## 2. Arsitektur dan Struktur Folder E2E Testing

Pengujian E2E diorganisasikan secara modular dalam direktori `e2e/`:

```
e2e/
├── fixtures/
│   ├── test-data.ts                     # Data dummy & kredensial akun uji
│   └── auth.fixture.ts                  # Helper session injection & mock gateway Midtrans
├── 01-auth-access.spec.ts               # Autentikasi, validasi form, role redirection & proteksi
├── 02-catalog-recommendation.spec.ts    # Katalog desain, pencarian, filter arsitektur & akses AI
├── 03-customer-project-journey.spec.ts  # Akses proyek, validasi tracking & pengajuan pembangunan
├── 04-admin-portal.spec.ts              # Dashboard admin, verifikasi dokumen, mandor & alokasi pengawas
├── 05-supervisor-mandor-portal.spec.ts  # Portal lapangan pengawas & mandor, dashboard & detail tugas
└── 06-payment-midtrans-mock.spec.ts     # Integrasi pembayaran Midtrans Snap (Mock/Sandbox)
```

---

## 3. Rincian Pengujian per Modul

### 3.1. Modul Autentikasi & Access Control (`01-auth-access.spec.ts`)
Menguji alur login multi-role, validasi input, pencegahan akses tanpa izin, dan registrasi customer:
- **1.1**: Verifikasi elemen UI login (email, password, tombol submit, heading).
- **1.2**: Validasi form: submit dengan input kosong memunculkan pesan wajib isi.
- **1.3**: Validasi form: format email tidak valid memunculkan pesan error.
- **1.4**: Login akun demo Admin (`admin@way2home.test`) sukses dan diarahkan ke `/admin`.
- **1.5**: Login akun demo Pengawas (`pengawas@way2home.test`) sukses dan diarahkan ke `/pengawas`.
- **1.6**: Login akun demo Mandor (`mandor@way2home.test`) sukses dan diarahkan ke `/mandor`.
- **1.7**: Proteksi rute: pengguna belum login mengakses `/admin` otomatis diarahkan ke `/login`.
- **1.8**: Proteksi rute: pengguna belum login mengakses `/pengawas` otomatis diarahkan ke `/login`.
- **1.9**: Proteksi rute: pengguna belum login mengakses `/mandor` otomatis diarahkan ke `/login`.
- **1.10**: Validasi registrasi customer: penanganan persetujuan syarat & ketentuan, input wajib, dan ketidakcocokan konfirmasi password.

### 3.2. Modul Katalog & Rekomendasi Desain AI (`02-catalog-recommendation.spec.ts`)
- **2.1**: Menampilkan katalog rumah lengkap dengan header, kolom pencarian (`#catalog-search`), dan filter.
- **2.2**: Fitur pencarian katalog secara dinamis menyaring desain berdasarkan kata kunci (contoh: "Modern").
- **2.3**: Navigasi ke detail desain katalog melalui kartu desain (`/katalog/[slug]`).
- **2.4**: Access control: pengaksesan rute AI Planning Based (`/ai-planning-based`) tanpa login diarahkan ke `/login`.

### 3.3. Modul Pengajuan Proyek & Tracking Customer (`03-customer-project-journey.spec.ts`)
- **3.1**: Access control: pengaksesan rute daftar proyek (`/proyek`) tanpa sesi diarahkan ke `/login`.
- **3.2**: Access control: pengaksesan rute detail proyek (`/proyek/[id]`) tanpa sesi diarahkan ke `/login`.
- **3.3**: Access control: pengaksesan rute tracking proyek (`/proyek/[id]/tracking`) tanpa sesi diarahkan ke `/login`.
- **3.4**: Validasi keamanan API: pemanggilan `POST /api/projects` tanpa autentikasi ditolak (HTTP 401/403).

### 3.4. Modul Admin Portal & Manajemen Verifikasi (`04-admin-portal.spec.ts`)
- **4.1**: Menampilkan Dashboard Admin (`/admin`) dengan metrik operasional, tren nilai proyek, dan navigasi admin.
- **4.2**: Menampilkan halaman Verifikasi Dokumen Customer (`/admin/verifikasi-dokumen`) beserta tabel pengajuan legalitas.
- **4.3**: Menampilkan halaman Verifikasi Calon Mandor (`/admin/verifikasi-mandor`) dengan input pencarian pendaftar dan daftar mitra.
- **4.4**: Menampilkan halaman Manajemen Alokasi Pengawas (`/admin/manajemen-pengawas`).
- **4.5**: Navigasi sidebar interaktif admin berpindah dengan mulus antar sub-modul verifikasi dan manajemen.

### 3.5. Modul Portal Pengawas & Mandor Lapangan (`05-supervisor-mandor-portal.spec.ts`)
- **5.1**: Menampilkan dashboard pengawas dengan panel navigasi (`/pengawas`).
- **5.2**: Verifikasi navigasi panel pengawas lapangan.
- **5.3**: Menampilkan dashboard mandor (`/mandor`) dengan metrik pekerjaan aktif dan ringkasan tugas.
- **5.4**: Navigasi mandor ke panel proyek lapangan (`/mandor/proyek`).
- **5.5**: Menampilkan detail proyek mandor (`/mandor/proyek/[id]`) lengkap dengan rincian pekerjaan dan tab ringkasan.

### 3.6. Modul Integrasi Pembayaran Midtrans Mocked (`06-payment-midtrans-mock.spec.ts`)
- **6.1**: Verifikasi kesiapan library Midtrans Snap pada window browser testing.
- **6.2**: Simulasi dan mock transaksi pembayaran tahap proyek (`POST /api/projects/[id]/pay`) menghasilkan token Snap yang valid tanpa membebankan dana riil.
- **6.3**: Validasi schema API pay: penolakan request dengan HTTP 400 bila format UUID payment stage tidak valid.

---

## 4. Hasil Verifikasi Bersama Unit Test (Vitest)

Untuk menjamin tidak terjadi regresi fungsi pada level unit dan service:
- Konfigurasi `vitest.config.ts` diperbarui dengan `include: ["src/**/*.{test,spec}.{ts,tsx}"]` dan `exclude: ["e2e/**", "node_modules/**"]`.
- Hasil eksekusi `npm.cmd run test:run`:
  - **20 test files passed (100%)**
  - **205 test cases passed (100%)**
  - **0 failed**
- Hasil eksekusi `npm.cmd run test:coverage`:
  - Layanan kritis seperti `access.service.ts` (100%), `format.ts` (100%), `midtrans-payment.ts` (100%), `stage-template.ts` (100%), `project-tracking.ts` (100%), dan `auth.service.ts` (97.29%) memiliki cakupan optimal.

---

## 5. Panduan Menjalankan Pengujian

```bash
# Menjalankan seluruh pengujian E2E Playwright
npm.cmd run test:e2e

# Menjalankan pengujian E2E dengan UI interaktif
npx.cmd playwright test --ui

# Menjalankan seluruh Unit Testing Vitest
npm.cmd run test:run

# Menjalankan pengukuran Code Coverage Vitest
npm.cmd run test:coverage

# Memverifikasi type safety kode
npx.cmd tsc --noEmit
```
