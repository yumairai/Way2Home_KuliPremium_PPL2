# Way2Home — Alur & Fitur Role Pengawas

> Dokumen ini adalah konteks untuk membangun halaman **Pengawas** di project Way2Home.
> Semua fitur di bawah berstatus **Prioritas 1 (WAJIB)**.

---

## 1. Gambaran Role

**Pengawas** adalah penghubung antara **Admin**, **Mandor**, dan **Customer** dalam sebuah proyek.

| Role     | Hubungan dengan Pengawas                                                                |
| -------- | --------------------------------------------------------------------------------------- |
| Admin    | Memverifikasi Mandor. Pengawas hanya bisa memilih Mandor yang sudah diverifikasi Admin. |
| Mandor   | Mengirim laporan progress & kendala. Pengawas memverifikasi dan menindaklanjuti.        |
| Customer | Hanya melihat informasi yang **dipilih/ditulis Pengawas** untuk ditampilkan.            |

**Prinsip utama:**

- Pengawas hanya mengakses proyek yang **ditugaskan kepadanya**.
- Laporan Mandor **bukan** status resmi sampai **diverifikasi Pengawas**.
- Informasi ke Customer **dikurasi** oleh Pengawas (tidak otomatis menampilkan semua data internal).

---

## 2. Ringkasan Alur Besar

```
Login
  └─> Dashboard Pengawas (daftar proyek yang ditugaskan)
        └─> Detail Proyek
              ├─> Pilih Mandor ──────────> Mandor ditugaskan ke proyek
              ├─> Kelola Progress <─────── Laporan Mandor
              │     └─> Verifikasi Progress ─> Status resmi proyek
              ├─> Kelola Kendala <──────── Laporan kendala Mandor
              │     └─> Tentukan tindak lanjut ─> Status diperbarui
              ├─> Update Informasi Customer ─> Tampil di sisi Customer
              ├─> Dokumentasi Lapangan (foto, catatan, hasil pemeriksaan)
              ├─> Monitoring Jadwal
              └─> Monitoring Pembayaran
```

---

## 3. Detail Fitur

### 3.1 Login

- Pengawas login menggunakan akun masing-masing.
- Setelah login berhasil, diarahkan ke **Dashboard Pengawas**.
- Akses halaman dibatasi khusus role Pengawas.

### 3.2 Dashboard Pengawas

Menampilkan **daftar proyek yang ditugaskan kepada Pengawas tersebut**.

Informasi minimal per proyek:

- Nama proyek
- Customer
- Desain
- Status
- Progress (persentase)
- Deadline

Dari sini, Pengawas dapat membuka **Detail Proyek**.

### 3.3 Detail Proyek

Pengawas dapat melihat:

- Kebutuhan Customer
- Desain
- Spesifikasi
- Kontrak
- Nilai proyek
- Jadwal
- Tahapan pekerjaan

Halaman ini menjadi **hub** menuju fitur lain (pilih Mandor, progress, kendala, dokumentasi, monitoring, dll).

### 3.4 Pilih Mandor

Pengawas melihat daftar Mandor yang **sudah diverifikasi Admin**.

Informasi minimal per Mandor:

- Nama
- Keahlian
- Pengalaman
- Area kerja
- Portofolio

**Alur:**

```
Pengawas melihat daftar Mandor terverifikasi
  → Pengawas memilih Mandor
  → Mandor ditugaskan ke proyek
```

### 3.5 Kelola Progress

Pengawas melihat laporan dari Mandor dan memperbarui status proyek per tahapan.

Contoh:

```
Tahap Struktur
Progress : 70%
Status   : Berjalan
```

### 3.6 Kelola Kendala

**Alur:**

```
Mandor melaporkan kendala
  → Pengawas memeriksa
  → Pengawas menentukan tindak lanjut
  → Status kendala diperbarui
```

### 3.7 Update Informasi untuk Customer

Pengawas menentukan informasi proyek apa yang ditampilkan kepada Customer.

Contoh pesan:

> "Pekerjaan struktur mengalami keterlambatan 2 hari karena keterlambatan material."

### 3.8 Verifikasi Progress Mandor

**Alur:**

```
Mandor mengirim laporan
  → Pengawas memverifikasi
  → Progress menjadi status resmi proyek
```

> Hanya progress yang **sudah diverifikasi** yang dihitung sebagai progress resmi dan dapat dipakai untuk informasi Customer.

### 3.9 Dokumentasi Lapangan

Pengawas dapat menambahkan:

- Foto
- Catatan
- Hasil pemeriksaan

### 3.10 Monitoring Jadwal

Pengawas melihat apakah proyek:

- Sesuai jadwal
- Terlambat
- Membutuhkan tindak lanjut

### 3.11 Monitoring Pembayaran

Pengawas dapat **melihat** status pembayaran yang berkaitan dengan tahapan proyek.

> Sifatnya **read-only** (monitoring). Pengawas tidak mengelola/mengubah pembayaran.

---

## 4. Ringkasan Halaman yang Dibutuhkan

| No  | Halaman               | Tujuan                                                 |
| --- | --------------------- | ------------------------------------------------------ |
| 1   | Login                 | Autentikasi Pengawas                                   |
| 2   | Dashboard             | Daftar proyek yang ditugaskan                          |
| 3   | Detail Proyek         | Info lengkap proyek + akses ke fitur lain              |
| 4   | Pilih Mandor          | Daftar Mandor terverifikasi & penugasan                |
| 5   | Kelola Progress       | Lihat laporan Mandor, update progress/status tahapan   |
| 6   | Verifikasi Progress   | Setujui laporan Mandor jadi status resmi               |
| 7   | Kelola Kendala        | Periksa kendala, tentukan tindak lanjut, update status |
| 8   | Update Info Customer  | Tulis/pilih informasi yang tampil ke Customer          |
| 9   | Dokumentasi Lapangan  | Tambah foto, catatan, hasil pemeriksaan                |
| 10  | Monitoring Jadwal     | Status ketepatan jadwal                                |
| 11  | Monitoring Pembayaran | Status pembayaran per tahapan (read-only)              |

> Catatan: Kelola Progress & Verifikasi Progress boleh digabung dalam satu halaman jika lebih praktis di UI.

---

## 5. Aturan Bisnis Penting

1. Pengawas hanya melihat proyek yang **ditugaskan kepadanya**.
2. Daftar Mandor yang bisa dipilih **hanya yang sudah diverifikasi Admin**.
3. Progress dari Mandor berstatus **belum resmi** sampai diverifikasi Pengawas.
4. Kendala dari Mandor harus **diperiksa dan diberi tindak lanjut** oleh Pengawas sebelum statusnya diperbarui.
5. Customer hanya melihat informasi yang **ditentukan Pengawas**.
6. Monitoring pembayaran bersifat **hanya lihat**.

---

## 6. Catatan untuk Implementasi

- Fokus pada **UI/halaman Pengawas** terlebih dahulu; ikuti struktur dan gaya UI yang sudah ada di project.
- Jika ada data/model yang belum tersedia (mis. status verifikasi laporan, tindak lanjut kendala, info Customer), **tanyakan atau buat dummy data** terlebih dahulu dan beri tanda jelas.
- Jangan mengubah fitur role lain (Admin, Mandor, Customer) kecuali diminta eksplisit.
