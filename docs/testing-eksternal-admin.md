# Testing eksternal admin

## Akun dan isolasi

- Satu akun: `admin-testing@way2home.test`.
- Akun Supabase memakai `role=admin` dan `is_test_user=true`; kedua field sudah diperbarui untuk akun testing.
- Mode lokal aktif hanya untuk email tersebut dengan flag test user.
- Login/auth tetap melalui Supabase. Data dashboard dan aksi bisnis pada empat halaman admin sepenuhnya lokal di browser.
- State dipisah menurut user ID, persisten di localStorage, dan dapat dikembalikan ke fixture awal melalui panel testing global pada seluruh route admin.
- Akun admin non-testing mempertahankan API dan alur normal.

## Halaman dan perilaku

1. **Dashboard** (`/admin`): ringkasan operasional realistis, tren enam bulan, daftar proyek dengan pencarian/filter. Metrik antrean dan badge navigasi terhubung pada state lokal; aksi dashboard selain pencarian/filter tidak ditambahkan.
2. **Verifikasi dokumen** (`/admin/verifikasi-dokumen`): empat pengajuan dummy, masing-masing memuat Sertifikat Tanah, KTP, IMB/PBG, dan Surat Kuasa. Aset visual dari `public/test-assets/documents` boleh digunakan ulang lintas pengajuan. Setiap dokumen diputuskan terpisah. Penolakan mewajibkan alasan. Dokumen yang sudah final masuk arsip dan tidak dapat diubah.
3. **Verifikasi mandor** (`/admin/verifikasi-mandor`): empat pendaftaran dummy dengan halaman detail/CV. Penolakan mewajibkan alasan. Keputusan final diarsipkan dan tidak dapat diubah.
4. **Manajemen pengawas** (`/admin/manajemen-pengawas`): enam proyek fixture dan lima pengawas dummy. Proyek yang sedang berjalan atau selesai sudah memiliki mandor dan pengawas; dua proyek menunggu alokasi pengawas. Admin dapat mengalokasikan pengawas yang tersedia untuk proyek eligible, dan hasil alokasi langsung tercermin pada dashboard. Assignment lokal tidak dapat dipindah setelah disimpan.

## Data desain

Data desain aktif Supabase dibaca sebagai referensi fixture, bukan dibaca live oleh halaman testing. Field yang tersedia antara lain nama, gaya arsitektur, luas tanah/bangunan, lantai, kamar tidur, durasi, dan estimasi biaya. Kolom `spesifikasi` pada baris yang diperiksa kosong; spesifikasi eksplisit di fixture testing dibuat sebagai data dummy berdasarkan tipe desain.

## Batas backend

- Mode testing tidak memanggil API bisnis dashboard, badge, dokumen, verifikasi mandor, atau alokasi pengawas.
- Perubahan hanya lokal; tidak mengubah proyek/customer/mandor/pengawas bisnis di Supabase.
- Reset panel testing mengembalikan antrean, arsip, keputusan, alokasi, metrik turunan, dan badge ke kondisi fixture awal.
- Perubahan role akun testing adalah konfigurasi auth terpisah dan bukan bagian state reset browser.

## Aset

Dokumen tersedia: `sertifikat-tanah-dummy.png`, `ktp-dummy.png`, `imb-dummy.jpg`, `surat-kuasa-dummy.png` di `public/test-assets/documents`.

## Verifikasi implementasi

Jalankan ESLint untuk file yang berubah, `npx tsc --noEmit`, dan test terarah `npm run test:run -- src/data/admin-test.test.ts`. Pastikan akun admin biasa tetap memakai jalur normal dan semua aksi akun testing tidak menghasilkan request mutasi API bisnis.
