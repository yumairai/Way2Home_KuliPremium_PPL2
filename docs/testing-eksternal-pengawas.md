# Konteks: Testing Eksternal Alur Pengawas

## Tujuan
Menyediakan alur testing UI pengawas menggunakan fixture dan state lokal, tanpa membaca/menulis data project, laporan progress, kendala, atau resolusi ke backend. Autentikasi tetap memakai Supabase yang sudah ada. Akun pengawas selain allowlist tetap menjalankan alur development normal.

## Akun testing
Tiga akun yang disiapkan dan sudah diperbaiki di Supabase:
- `pengawas-testing-1@way2home.test`
- `pengawas-testing-2@way2home.test`
- `pengawas-testing-3@way2home.test`

Ketiga akun telah diverifikasi memiliki `profiles.role = 'pengawas'`, `profiles.is_test_user = true`, dan baris `pengawas_profiles` aktif. Mode test hanya aktif setelah user terautentikasi dan role/marker/allowlist cocok.

## Temuan alur development
- Shell/layout: `src/app/pengawas/layout.tsx`, `src/components/pengawas/PengawasShell.tsx`.
- Dashboard/list: `src/components/pengawas/PengawasDashboard.tsx`, data service `src/services/allocation.service.ts` dan `src/services/supervisor.service.ts`.
- Detail project: `src/components/pengawas/ProjectDetail.tsx`, hook `src/hooks/useSupervisorProject.ts`, data shape `src/data/pengawas.ts`.
- Verifikasi laporan development berada pada `ReportReview` dan handler `decideReport` di `ProjectDetail.tsx`. UI mengirim `PATCH /api/pengawas/reports/${id}` dengan keputusan serta feedback, kemudian reload data. Laporan yang disetujui menandai subtask selesai dan menghitung ulang progres resmi.
- Kendala ditampilkan dari `issueReports` terstruktur serta `project.issues`. Workflow analisis/penanganannya berada di `IssueWorkflow` dalam `ProjectDetail.tsx`.
- Tombol Analisis AI memanggil `POST /api/pengawas/kendala/${id}/ai-analysis` tanpa body. Route itu memanggil `generateIssueAiAnalysis(supabase, id)` di `src/services/ai-kendala.service.ts`, yang membaca konteks dari Supabase sebelum menghubungi FastAPI.
- Foto fixture tersedia di `public/test-assets/progress/`: `progress-01-pondasi.jpg`, `progress-02-struktur.webp`, `progress-03-dinding.jpg`, `progress-04-atap.jpg`, `progress-05-plester.webp`, `progress-06-instalasi.jpeg`, `progress-07-keramik.jpg`, `progress-08-pengecatan.webp`.

## Perilaku testing lokal
- Dashboard dan detail menampilkan project dummy lokal per akun, dengan enam milestone dan seluruh subtask, bermula dari progress 0%.
- Kartu proyek dashboard mengikuti tampilan development tanpa foto: pengawas memilih mandor, lalu menandatangani kontrak.
- Tanda tangan pengawas digambar melalui signature pad dan disimpan sebagai data lokal per akun. Sesudah itu tanda tangan customer memakai aset test dan pembayaran DP (30%) otomatis disimulasikan; alokasi dan tanda tangan test tidak dilakukan dari halaman detail.
- Siapkan fixture laporan mandor untuk keenam milestone/subtask secara lokal. Jangan membuat/menyimpan laporan ini ke database.
- Floating panel kanan bawah hanya menyediakan pembayaran cicilan testing dan menampilkan batas progress yang terbuka.
- Cicilan 1, 2, dan 3 terbuka saat progress proyek mencapai 30%, 55%, dan 78%; setelah masing-masing dibayar, batas progress menjadi 55%, 78%, dan 100%.
- Kontrol simulasi laporan, kendala, dan reset berada di halaman detail proyek:
  - **Buat laporan milestone berikutnya**: membuat/menampilkan batch laporan subtask lokal untuk milestone berikutnya dalam status menunggu.
  - **Selesaikan tanpa approval**: menindaklanjuti kendala lokal yang belum memiliki usulan dan memang tidak memerlukan persetujuan customer. Tombol ini tidak menimpa usulan yang sedang menunggu customer atau diskusi.
  - **Kontrol simulasi customer** pada usulan yang menunggu approval: setujui untuk meneruskan solusi ke mandor, atau tolak dengan alasan untuk membuka tahap diskusi pengawas.
  - Setelah customer menolak, pengawas dapat mengirim tanggapan untuk meminta approval ulang (customer bisa menyetujui/menolak lagi) atau menetapkan keputusan final ke mandor. Semua keputusan dan riwayat diskusi tersimpan di state lokal.
  - **Reset ke 0%**: mengembalikan state fixture akun ke awal.
- Milestone berikutnya baru dapat dibuat setelah semua laporan subtask milestone aktif sudah diverifikasi. Pengawas menyetujui atau meminta revisi per laporan melalui UI yang sudah ada. Persetujuan menandai subtask selesai dan memperbarui progress lokal; revisi tidak menaikkan progress.
- Setelah semua subtask milestone keenam disetujui, progress menjadi 100%, project berstatus selesai, dan kontrol pembuatan laporan berikutnya tidak lagi aktif.
- Foto laporan menggunakan aset dari `public/test-assets/progress/` bila sesuai. Foto tetap data fixture lokal.
- AI kendala memakai UX/tampilan analisis yang sudah ada, tetapi jalur khusus menerima konteks project dan kendala dummy secara langsung, tanpa query/insert/update DB. Konteks dikirim ke layanan AI development yang ada; hasil analisis disimpan di state lokal browser saja.
- State lokal per akun bertahan setelah refresh, dibersihkan saat logout dan saat browser/tab ditutup sejauh event penutupan halaman berjalan. Panel memberi reset eksplisit karena penutupan paksa browser tidak selalu memicu event.
- Tidak ada laporan, progres, kendala, resolusi, atau hasil AI testing yang ditulis ke Supabase. Akun non-testing tidak boleh diarahkan ke jalur lokal.

## Batasan dan perhatian
- Backend AI development yang ada mengharapkan konteks hasil query database. Buat boundary/handler khusus yang menerima payload dummy dan reuse fungsi pemanggilan AI yang sesuai; jangan meneruskan ID fixture ke endpoint DB-backed.
- Jangan memodifikasi endpoint normal atau perilaku akun pengawas development.
- Untuk report UI, gunakan bentuk DTO `SupervisorProject`/`SupervisorReport`, bukan row database mentah.
- Data AI yang dikirim ke layanan development berisi konteks dummy, dan hasilnya tetap lokal. Tidak ada penulisan data proyek ke backend.

## Cakupan verifikasi implementasi
1. Login ketiga akun mengaktifkan mode testing; akun pengawas lain tetap normal.
2. Dashboard dan detail berisi fixture lokal tanpa request API project.
3. Buat batch laporan milestone pertama; tiap subtask terlihat menunggu.
4. Verifikasi/revisi setiap laporan, refresh, dan cek progress serta gating milestone berikutnya.
5. Selesaikan semua enam milestone; cek progress 100%, status selesai, dan tidak ada batch berikutnya.
6. Uji jalur kendala tanpa approval, usulan yang disetujui customer, penolakan customer, tanggapan dan approval ulang, serta keputusan final pengawas. Pastikan status mandor dan riwayat diskusi sesuai.
7. Analisis kendala via AI lokal-context; cek hasil tersimpan sesudah refresh.
8. Reset dan logout membersihkan state; tidak ada mutation database dari mode testing.
