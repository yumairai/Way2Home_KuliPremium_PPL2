# Way2Home — Alur & Fitur Role Mandor

> Dokumen ini adalah konteks untuk membangun halaman **Mandor** di project Way2Home.

## ⚠️ Prinsip Utama

**Mandor dibuat sesederhana mungkin.**
Dashboard Mandor **tidak boleh** berkembang menjadi sistem manajemen konstruksi sendiri.
Mandor hanya: **melihat tugas → melapor progress → melapor kendala.**
Pengelolaan, verifikasi, dan keputusan tetap ada di sisi **Pengawas**.

> Jangan menambah fitur di luar daftar di bawah, terutama fitur Prioritas 3, kecuali diminta eksplisit.

---

## 1. Gambaran Role

| Role     | Hubungan dengan Mandor                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Admin    | Memverifikasi pendaftaran Mandor (Pending / Disetujui / Ditolak).                                                                          |
| Pengawas | Memilih Mandor yang disetujui, menugaskan ke proyek, memberi instruksi, menerima laporan, memverifikasi progress, menindaklanjuti kendala. |
| Customer | Tidak berinteraksi langsung dengan Mandor.                                                                                                 |

---

## 2. Ringkasan Alur Besar

```
Register Mitra
  └─> Verifikasi Admin (Pending → Disetujui / Ditolak)
        └─> (Disetujui) Bisa dipilih Pengawas & ditugaskan ke proyek
              └─> Login
                    └─> Lihat Proyek (yang ditugaskan)
                          └─> Lihat Pekerjaan
                                ├─> Lapor Progress ──> diverifikasi Pengawas
                                └─> Lapor Kendala  ──> diterima & ditindaklanjuti Pengawas
```

---

## 3. 🔴 Prioritas 1 — WAJIB

### 3.1 Register Mitra

Mandor mendaftarkan diri.

Data yang diisi:

- Identitas
- Keahlian
- Pengalaman
- Area kerja
- Portofolio

### 3.2 Verifikasi Admin

Status pendaftaran Mandor:

- **Pending** — menunggu review Admin
- **Disetujui**
- **Ditolak**

**Aturan:** hanya Mandor berstatus **Disetujui** yang muncul dan bisa dipilih Pengawas.

> Verifikasi dilakukan oleh Admin (bukan bagian dari halaman Mandor), tapi status ini harus tersimpan dan terbaca oleh alur Mandor & Pengawas.

### 3.3 Login

- Mandor login dengan akun masing-masing.
- Akses halaman dibatasi khusus role Mandor.
- Mandor yang belum disetujui (Pending/Ditolak) tidak mendapat akses ke fitur proyek.

### 3.4 Lihat Proyek

Mandor melihat **daftar proyek yang ditugaskan kepadanya**.

### 3.5 Lihat Pekerjaan

Mandor melihat:

- Desain
- Scope pekerjaan
- Tahapan
- Target pekerjaan
- Instruksi Pengawas

Halaman ini **read-only**.

### 3.6 Lapor Progress

Mandor mengirim:

- Progress
- Status pekerjaan
- Keterangan

> Laporan ini **belum menjadi status resmi** sampai diverifikasi Pengawas.

### 3.7 Lapor Kendala

Mandor melaporkan kendala di lapangan.

Contoh:

> "Material belum tersedia sehingga pekerjaan struktur tertunda."

Setelah dikirim, **Pengawas menerima laporan tersebut** (masuk ke alur Kelola Kendala di sisi Pengawas).

---

## 4. 🟡 Prioritas 2 — PENTING

(Dikerjakan setelah Prioritas 1 selesai)

- Upload foto progress
- Riwayat laporan
- Melihat feedback Pengawas
- Melihat status tindak lanjut kendala

---

## 5. 🟢 Prioritas 3 — OPSIONAL

(**Jangan dikerjakan** kecuali diminta eksplisit)

- Chat dengan Pengawas
- Notifikasi
- Statistik pekerjaan Mandor
- Portfolio management yang kompleks

---

## 6. Ringkasan Halaman (Prioritas 1)

| No  | Halaman             | Tujuan                                                         |
| --- | ------------------- | -------------------------------------------------------------- |
| 1   | Register Mitra      | Pendaftaran Mandor                                             |
| 2   | Login               | Autentikasi Mandor                                             |
| 3   | Daftar Proyek       | Proyek yang ditugaskan                                         |
| 4   | Detail Pekerjaan    | Desain, scope, tahapan, target, instruksi Pengawas (read-only) |
| 5   | Form Lapor Progress | Kirim progress, status, keterangan                             |
| 6   | Form Lapor Kendala  | Kirim laporan kendala                                          |

> Detail Pekerjaan boleh menjadi tempat tombol/akses ke form Lapor Progress & Lapor Kendala agar navigasi tetap sederhana.

---

## 7. Aturan Bisnis Penting

1. Mandor hanya bisa dipilih Pengawas jika status verifikasi **Disetujui**.
2. Mandor hanya melihat proyek yang **ditugaskan kepadanya**.
3. Laporan progress dari Mandor **belum resmi** sampai diverifikasi Pengawas.
4. Laporan kendala otomatis **diterima Pengawas** untuk diperiksa dan ditindaklanjuti.
5. Mandor **tidak** mengelola jadwal, pembayaran, kontrak, atau informasi Customer.

---

## 8. Catatan untuk Implementasi

- Utamakan UI yang **minimal dan ringan**, mudah dipakai di lapangan (idealnya nyaman di layar HP).
- Hanya kerjakan **Prioritas 1** kecuali diminta lain.
- Alur ini terhubung dengan role Pengawas: data laporan progress & kendala harus bisa dibaca di sisi Pengawas (lihat dokumen `way2home-pengawas-flow.md`).
- Jika ada model/data yang belum tersedia, **tanyakan atau pakai dummy data** dan beri tanda jelas.
- Jangan mengubah fitur role lain (Admin, Pengawas, Customer) kecuali diminta eksplisit.
