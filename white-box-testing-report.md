# LAPORAN WHITE BOX TESTING
## Way2Home – Sistem Manajemen Pembangunan Rumah

### 1. Ringkasan Pengujian

White Box Testing dilakukan pada sistem Way2Home untuk menguji logika internal program, terutama fungsi-fungsi yang berkaitan dengan proses bisnis utama. Pengujian dilakukan menggunakan **Vitest 3.2.7** sebagai test runner dan **V8 Coverage** untuk mengukur cakupan kode yang telah dieksekusi selama pengujian.

Beberapa tools dan library yang digunakan meliputi:

- **Vitest**: menjalankan test case dan melakukan assertion terhadap hasil fungsi.
- **V8 Coverage**: mengukur cakupan kode berdasarkan statement, branch, function, dan line.
- **jsdom**: menyediakan lingkungan DOM untuk pengujian yang membutuhkan lingkungan browser.
- **React Testing Library**: mendukung pengujian komponen React.
- **vi.fn(), vi.mock(), dan vi.spyOn()**: membuat mock, simulasi fungsi, serta memantau pemanggilan fungsi selama pengujian.

Hasil pengujian terakhir menunjukkan:

| Indikator | Hasil |
|---|---:|
| Test files | 20 |
| Total test cases | 205 |
| Test passed | 205 |
| Test failed | 0 |
| Statement coverage | 7% |
| Branch coverage | 57,9% |
| Function coverage | 20,8% |
| Line coverage | 7% |

Seluruh test case yang telah dibuat berhasil dijalankan. Namun, persentase coverage menunjukkan bahwa pengujian belum mencakup seluruh kode aplikasi, terutama pada API routes, halaman, komponen antarmuka, dan hooks.

### 2. Metodologi Pengujian

White Box Testing dilakukan dengan memeriksa bagian internal kode program dan menguji hasil eksekusi berdasarkan masukan tertentu.

Pengujian menggunakan beberapa metrik cakupan kode:

1. **Statement Coverage**  
   Mengukur persentase pernyataan kode yang telah dieksekusi oleh test case.

2. **Branch Coverage**  
   Mengukur persentase cabang keputusan yang telah dijalankan, misalnya kondisi `if`, `else`, dan percabangan lainnya.

3. **Function Coverage**  
   Mengukur persentase fungsi yang telah dipanggil selama pengujian.

4. **Line Coverage**  
   Mengukur persentase baris kode yang telah dieksekusi.

Selain metrik tersebut, test case dirancang untuk memeriksa beberapa kondisi sesuai fungsi yang diuji, seperti masukan valid dan tidak valid, kondisi batas, serta penanganan kegagalan. Pengujian terhadap kondisi-kondisi tersebut tidak berarti seluruh kemungkinan jalur program telah diuji.

### 3. Inventaris Test Suite

Pengujian dilakukan menggunakan 20 file test yang mencakup sejumlah fungsi dan layanan utama Way2Home.

| No. | File Pengujian | Fokus Pengujian |
|---:|---|---|
| 1 | `recommendation.service.test.ts` | Logika rekomendasi desain rumah, perhitungan kemiripan, prioritas kriteria, dan penyesuaian anggaran. |
| 2 | `allocation.service.test.ts` | Proses alokasi Pengawas dan Mandor, termasuk batas jumlah Mandor, duplikasi, dan penghapusan alokasi. |
| 3 | `supervisor.service.test.ts` | Proses verifikasi laporan, revisi, catatan, pembaruan progres, dan tindak lanjut kendala. |
| 4 | `stage.service.test.ts` | Pengolahan tahapan pembangunan, normalisasi data tahapan, dan perhitungan progres proyek. |
| 5 | `admin-verification.service.test.ts` | Proses verifikasi dokumen oleh Admin. |
| 6 | `mandor-verification.service.test.ts` | Proses verifikasi data dan dokumen Mandor. |
| 7 | `auth.service.test.ts` | Fungsi autentikasi dan pengelolaan proses yang berkaitan dengan akun pengguna. |
| 8 | `notification.service.test.ts` | Proses pembuatan dan pengiriman notifikasi serta penanganan kondisi kegagalan. |
| 9 | `design.service.test.ts` | Pengolahan data desain rumah. |
| 10 | `mandor.service.test.ts` | Fungsi pengelolaan data Mandor. |
| 11 | `access.service.test.ts` | Validasi hak akses berdasarkan peran pengguna. |
| 12 | `project.service.test.ts` | Fungsi pengelolaan dan validasi data proyek. |
| 13 | `progress.service.test.ts` | Perhitungan dan pengelolaan progres pembangunan. |
| 14 | `ai-kendala.service.test.ts` | Logika analisis kendala dan pengolahan informasi terkait risiko proyek. |
| 15 | `subtask-seeding.service.test.ts` | Proses pembentukan data tahapan dan subtask pembangunan. |
| 16 | `midtrans-payment.test.ts` | Fungsi pendukung pemrosesan pembayaran dan penanganan respons Midtrans. |
| 17 | `format.test.ts` | Fungsi pemformatan data. |
| 18 | `stage-template.test.ts` | Struktur dan template tahapan pembangunan. |
| 19 | `project-tracking.test.ts` | Pengolahan data pelacakan proyek. |
| 20 | `example.test.ts` | Pengujian dasar untuk memastikan konfigurasi lingkungan testing dapat berjalan. |

Pengujian tersebut mencakup fungsi-fungsi terpilih dari modul autentikasi, rekomendasi desain, manajemen proyek, alokasi tenaga kerja, verifikasi, progres pembangunan, pembayaran, notifikasi, serta utilitas pendukung.

### 4. Hasil Code Coverage

Berdasarkan hasil eksekusi `npm.cmd run test:coverage`, diperoleh persentase cakupan kode sebagai berikut.

#### 4.1 Coverage Keseluruhan

| Metrik | Coverage |
|---|---:|
| Statements | 7% |
| Branches | 57,9% |
| Functions | 20,8% |
| Lines | 7% |

Persentase statement dan line coverage yang masih rendah dipengaruhi oleh konfigurasi pengukuran yang mencakup seluruh file TypeScript dan TSX di dalam direktori `src`, termasuk halaman, komponen React, hooks, API routes, services, utilities, dan data.

Dengan demikian, hasil coverage keseluruhan tidak hanya menggambarkan pengujian fungsi business logic, tetapi juga kode aplikasi lain yang belum menjadi fokus pengujian.

#### 4.2 Coverage Direktori Services

Direktori `src/services` merupakan salah satu fokus utama pengujian karena berisi fungsi-fungsi yang menangani proses bisnis sistem.

| Metrik | Coverage |
|---|---:|
| Statements | 27,83% |
| Branches | 71,02% |
| Functions | 35,29% |
| Lines | 27,83% |

Hasil tersebut menunjukkan bahwa sebagian percabangan logika pada service telah diuji. Namun, masih terdapat fungsi dan pernyataan kode yang belum dieksekusi oleh test case.

#### 4.3 Coverage Beberapa File Utama

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `access.service.ts` | 100% | 100% | 100% | 100% |
| `recommendation.service.ts` | 100% | 78,43% | 100% | 100% |
| `auth.service.ts` | 97,29% | 73,33% | 100% | 97,29% |
| `subtask-seeding.service.ts` | 76,41% | 68,18% | 100% | 76,41% |
| `admin-verification.service.ts` | 43,37% | 80% | 50% | 43,37% |
| `design.service.ts` | 38,15% | 71,42% | 66,66% | 38,15% |
| `allocation.service.ts` | 35,55% | 74,07% | 44,44% | 35,55% |
| `notification.service.ts` | 34,07% | 34,37% | 31,25% | 34,07% |
| `mandor-verification.service.ts` | 32,06% | 57,14% | 16,66% | 32,06% |
| `mandor.service.ts` | 30,37% | 54% | 20% | 30,37% |
| `stage.service.ts` | 23,88% | 80% | 33,33% | 23,88% |
| `ai-kendala.service.ts` | 24,26% | 84% | 25% | 24,26% |
| `supervisor.service.ts` | 13,31% | 78,57% | 8% | 13,31% |
| `progress.service.ts` | 12,26% | 75% | 23,52% | 12,26% |
| `project.service.ts` | 9,03% | 100% | 40% | 9,03% |

*Catatan: Persentase di atas merupakan hasil pengukuran pada file yang bersangkutan. Branch coverage yang tinggi tidak selalu berarti seluruh fungsi atau seluruh baris pada file telah diuji.*

#### 4.4 Coverage Utilities dan Data

Beberapa file utilities dan data yang ikut tercakup dalam pengukuran menunjukkan hasil berikut.

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `format.ts` | 100% | 100% | 100% | 100% |
| `midtrans-payment.ts` | 100% | 100% | 100% | 100% |
| `project-tracking.ts` | 100% | 100% | 100% | 100% |
| `stage-template.ts` | 100% | 100% | 100% | 100% |
| `house-designs.ts` | 99,14% | 100% | 0% | 99,14% |
| `location-mapping.ts` | 95,23% | 100% | 50% | 95,23% |

Coverage pada file data dapat terjadi ketika file tersebut dieksekusi melalui proses pengujian atau diimpor oleh modul yang diuji. Hal tersebut tidak selalu menunjukkan adanya file test khusus untuk setiap file data.

### 5. Bagian yang Belum Terjangkau Pengujian

Meskipun seluruh test case yang dibuat berhasil dijalankan, masih terdapat beberapa bagian aplikasi yang belum memiliki cakupan pengujian memadai.

Beberapa bagian yang masih perlu ditingkatkan antara lain:

1. **API Routes**  
   Banyak endpoint pada direktori `src/app/api` belum tercakup dalam pengujian. Pengujian lanjutan dapat dilakukan terhadap validasi request, respons API, otorisasi, dan penanganan kesalahan.

2. **Komponen Antarmuka (React Components)**  
   Komponen antarmuka belum banyak diuji. Pengujian dapat mencakup tampilan berdasarkan kondisi data, interaksi pengguna, dan respons terhadap kegagalan proses.

3. **Hooks**  
   Custom hooks yang digunakan untuk mengelola state dan proses aplikasi masih memerlukan pengujian tersendiri.

4. **Fungsi Service yang Belum Terjangkau**  
   Beberapa fungsi pada service, khususnya fungsi pengambilan data dan proses yang berinteraksi dengan database, belum sepenuhnya tercakup.

5. **Integrasi dengan Layanan Eksternal**  
   Pengujian yang menggunakan mock belum sepenuhnya membuktikan bahwa integrasi dengan Supabase, Midtrans, dan layanan email berjalan dengan benar pada lingkungan sebenarnya.

Dengan mempertimbangkan keterbatasan waktu pengembangan, pengujian difokuskan pada fungsi-fungsi business logic yang dianggap penting bagi proses utama sistem.

### 6. Analisis Hasil Pengujian

Berdasarkan hasil pengujian, dapat disimpulkan beberapa hal:

1. Sebanyak 205 test case berhasil dijalankan tanpa kegagalan. Hal ini menunjukkan bahwa seluruh test case yang telah disusun memberikan hasil sesuai ekspektasi yang ditentukan dalam pengujian.

2. Beberapa modul memperoleh coverage tinggi, seperti `access.service.ts`, `recommendation.service.ts`, `auth.service.ts`, serta beberapa file utilities dan data. Hasil tersebut menunjukkan bahwa fungsi-fungsi yang dieksekusi pada modul tersebut telah tercakup dengan baik berdasarkan metrik coverage masing-masing.

3. Branch coverage pada direktori services mencapai 71,02%. Hal ini menunjukkan bahwa sejumlah percabangan logika pada fungsi-fungsi service telah dieksekusi selama pengujian.

4. Statement dan line coverage keseluruhan masih sebesar 7%. Kondisi tersebut menunjukkan bahwa masih banyak kode aplikasi yang belum dieksekusi dalam pengujian, terutama pada bagian antarmuka, API routes, dan hooks.

5. Pengujian yang dilakukan belum mencakup seluruh kemungkinan jalur eksekusi sistem. Oleh karena itu, hasil pengujian tidak dapat diartikan sebagai jaminan bahwa seluruh fungsi dan skenario penggunaan telah bebas dari kesalahan.

### 7. Kesimpulan

Berdasarkan pelaksanaan White Box Testing pada Way2Home menggunakan Vitest 3.2.7 dan V8 Coverage, diperoleh hasil sebanyak **20 file pengujian dengan total 205 test case berhasil dan 0 test case gagal**.

Pengujian telah mencakup sejumlah fungsi utama sistem, terutama pada modul autentikasi, rekomendasi desain rumah, pengelolaan proyek, alokasi tenaga kerja, verifikasi, progres pembangunan, pembayaran, dan notifikasi.

Hasil pengukuran menunjukkan statement coverage sebesar 7%, branch coverage sebesar 57,9%, function coverage sebesar 20,8%, dan line coverage sebesar 7%. Sementara itu, direktori `src/services` memperoleh statement coverage 27,83%, branch coverage 71,02%, function coverage 35,29%, dan line coverage 27,83%.

Dengan demikian, White Box Testing telah berhasil dilakukan terhadap sejumlah fungsi internal sistem yang menjadi fokus pengujian. Namun, cakupan pengujian belum mencakup keseluruhan kode aplikasi. Pengujian lanjutan masih dapat dilakukan pada API routes, komponen antarmuka, hooks, serta fungsi service yang belum terjangkau untuk meningkatkan cakupan dan keandalan sistem.