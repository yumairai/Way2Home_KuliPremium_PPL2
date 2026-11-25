# Konteks: Testing Eksternal Alur Mandor

## Tujuan
Menyediakan mode testing tampilan alur mandor untuk tiga akun khusus. Login tetap menggunakan autentikasi Supabase yang sudah ada. Setelah login, seluruh data proyek dan aktivitas mode testing berasal dari data lokal; tidak ada perubahan proyek/laporan testing yang dikirim ke backend.

## Akun testing
Daftar akun yang mengaktifkan mode ini:
- `mandor-testing-1@way2home.test`
- `mandor-testing-2@way2home.test`
- `mandor-testing-3@way2home.test`

Kondisi akun telah diperiksa dan diperbarui di Supabase:
- `profiles.role = 'mandor'`
- `profiles.is_test_user = true`
- `mandor_profiles.status = 'approved'`

Akun mandor selain daftar tersebut tetap mengikuti alur normal/development. Password yang diberikan untuk akun testing sama, `testing123`; jangan simpan password di source code atau dokumen ini.

## Perilaku mode testing
- Setiap akun menampilkan satu project dummy tetap, dimulai dari progress 0%.
- Seluruh alur mandor yang relevan—dashboard, daftar project, detail project, laporan progress, dan kendala bila tersedia—menggunakan data lokal untuk akun testing.
- Form laporan mengikuti interaksi dan validasi UI yang sudah ada.
- Laporan progress disimpan lokal, langsung ditandai terverifikasi (bypass pengawas), dan persentase project diperbarui berdasarkan input laporan dengan mengikuti mekanisme progres UI yang sekarang.
- Akun non-testing tetap memakai API/backend dan perilaku verifikasi yang normal.
- Floating testing badge tampil di kanan bawah, konsisten dengan pengalaman customer, dan menyediakan indikator mode serta aksi reset data testing.

## Penyimpanan dan siklus hidup
- Data dummy per akun bertahan setelah refresh.
- Data testing dihapus saat logout dan saat browser/tab ditutup sejauh event penutupan halaman dapat ditangani.
- Aksi reset pada badge mengembalikan project dan laporan lokal ke keadaan awal 0%.
- Implementasi perlu memperhatikan bahwa browser tidak selalu menjalankan event penutupan pada proses yang dihentikan paksa. Logout tetap menjadi jalur penghapusan yang deterministik.

## Batasan teknis dan keamanan
- Mode testing tidak boleh dipilih hanya dari input email login sebelum autentikasi. Aktifkan setelah identitas/role user terverifikasi dari sesi backend, lalu cek allowlist dan/atau penanda `is_test_user`.
- Jangan mengirim laporan dummy, kendala, atau perubahan progress ke endpoint backend.
- Jangan mengubah alur akun mandor lain.
- Jangan menanam kredensial di kode.
- Hindari menyimpan data testing lintas akun pada key storage yang sama tanpa pemisahan identitas.

## Cakupan implementasi yang diharapkan
1. Integrasikan deteksi akun test mandor dengan status sesi/profile terverifikasi.
2. Sediakan model/fixture project dummy per akun dan state lokal untuk progress/laporan.
3. Cabangkan data layer/hook mandor agar seluruh UI testing membaca dan menulis state lokal, sementara alur normal tidak berubah.
4. Tambahkan badge testing mandor dan kontrol reset.
5. Bersihkan state saat logout dan upayakan pembersihan saat penutupan browser/tab.
6. Uji akun testing, akun mandor normal, refresh, reset, submit laporan, dan logout.

## Catatan implementasi
Sebelum coding, periksa panduan Next.js yang berlaku di `node_modules/next/dist/docs/` dan pola mode test customer yang sudah ada. Pemetaan bagaimana progress report memengaruhi progress kumulatif harus mengikuti implementasi UI/hook mandor saat ini, bukan mengasumsikan bahwa nilai report selalu ditambahkan secara langsung.
