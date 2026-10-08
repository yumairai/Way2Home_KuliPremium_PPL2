# Alur Proyek & Kontrak — Way2Home (Frontend Next.js)

Dokumentasi alur milestone proyek + kontrak. Sumber kebenaran untuk checkpoint selanjutnya agar implementasi tetap konsisten.

## 1. Alur Milestone Proyek

```text
Pengajuan
  → Verifikasi Dokumen
    → Alokasi Mandor & Pengawas
      → Kontrak Proyek            ← milestone baru (inti perubahan)
        → Pembayaran DP (7×24 jam)
          → Proyek Aktif
            → Selesai
```

Perubahan dari legacy Laravel: **alokasi mandor dipindah sebelum kontrak**, dan milestone **Kontrak Proyek** disisipkan antara alokasi tim dan pembayaran DP. Tujuan: kontrak bisa menampilkan mandor/pengawas yang diassign, dan uang belum keluar saat kontrak ditolak (tidak ada masalah refund).

## 2. Status Proyek

Enum `ProjectStatus` di [src/types/proyek.ts](file:///d:/Semester%207/PPL%202/way2home/src/types/proyek.ts):

| Status | Arti |
|---|---|
| `Menunggu Verifikasi` | Dokumen diajukan, menunggu review |
| `Revisi Dokumen` | Dokumen ditolak, customer upload ulang |
| `Alokasi Tim` | Verifikasi lolos, menunggu admin alokasi mandor & pengawas |
| `Kontrak Proyek` | Tim sudah dialokasikan, kontrak menunggu tanda tangan |
| `Pembayaran DP` | Kontrak disetujui, DP ditagih (deadline 7×24 jam) |
| `Proyek Aktif` | DP lunas, pengerjaan berjalan |
| `Selesai` | Seluruh tahap selesai |
| `Dibatalkan` | Proyek batal permanen |

## 3. Status Kontrak

Enum `ContractStatus` — **terpisah dari status proyek**:

| Status | Arti |
|---|---|
| `menunggu` | Kontrak terbit, menunggu tanda tangan customer (countdown 7×24 jam) |
| `disetujui` | Customer setuju & tandatangani → lanjut ke DP |
| `ditolak` | Customer tolak + alasan → masuk loop revisi |
| `revisi` | Admin kirim ulang kontrak setelah revisi |
| `kedaluwarsa` | Customer tidak merespon 7×24 jam → proyek nonaktif, **bukan** batal; customer bisa ajukan ulang |

### Loop Revisi (reject fallback)

```text
menunggu → (tolak + alasan wajib) → ditolak → (admin kirim ulang) → revisi → (customer review) → menunggu
```

- Customer melihat banner "Kontrak sedang direvisi tim Way2Home, estimasi 1×24 jam" + alasan penolakannya sendiri.
- Admin hanya menambahkan komentar/feedback (`adminNotes`); isi kontrak regenerasi otomatis.
- Loop tanpa batas. Batalkan proyek permanen tetap tersedia terpisah.

## 4. Aturan Bisnis

- **Trigger kontrak**: sistem auto-generate setelah admin alokasi mandor + pengawas. Ketentuan (pasal) dari template sistem, data dari proyek.
- **Deadline tanda tangan**: 7×24 jam sejak kontrak terbit → lewat = `kedaluwarsa` (bukan batal).
- **Deadline DP**: 7×24 jam sejak kontrak **disetujui** (bergeser dari legacy yang dihitung sejak verifikasi).
- **Pembatalan proyek**: bebas selama kontrak belum disetujui (termasuk saat loop revisi). Setelah disetujui → tombol terkunci.
- **Aksi setuju/tolak**: checkbox "Saya telah membaca dan memahami..." wajib dicentang; tolak juga wajib isi alasan.

## 5. Skema Pembayaran

DP 30% + 3 cicilan berbasis **tanggal jatuh tempo bulanan** (dihitung otomatis dari tanggal mulai, bukan milestone konstruksi):

| Periode | Porsi | Status enum |
|---|---|---|
| 0 — Down Payment | 30% | `lunas` / `menunggu` / `aktif` |
| 1 — Cicilan 1 | 25% | `lunas` / `aktif` / `akan_datang` |
| 2 — Cicilan 2 | 25% | idem |
| 3 — Cicilan 3 | 20% | idem |

## 6. Isi Kontrak (modal)

Dokumen formal: kop judul, para pihak, pasal bernomor (ketentuan template), tabel data proyek, tanda tangan. Bagian:

- Ruang lingkup pekerjaan (list `scope`)
- Data proyek (tipe, gaya, lokasi, area, nilai, durasi)
- Tahapan pembayaran
- Tim pelaksana (Mandor & Pengawas — dua role terpisah, mock data)
- Ketentuan proyek (template pasal sistem, hardcoded di `ContractModal.tsx`)

## 7. Peta File

```text
src/
├── types/proyek.ts                    # Tipe Project, Contract, Payment, TeamMember
├── data/proyek.ts                     # MOCK DATA TERPUSAT — edit di sini untuk simulasi
├── hooks/useCountdown.ts              # Countdown real-time + format teks
├── utils/format.ts                    # formatRupiah, formatDate (locale id-ID)
├── components/proyek/
│   ├── ProjectSidebar.tsx             # List proyek + badge status (sticky)
│   ├── ProjectDetail.tsx              # Kartu hero desain + info grid
│   ├── ActionPanel.tsx                # Banner per status + countdown + tombol aksi
│   ├── ContractModal.tsx              # Dokumen kontrak + aksi setuju/tolak
│   ├── MilestoneSidebar.tsx           # Timeline milestone + tombol Lihat Kontrak
│   └── PaymentsSection.tsx            # Grid tahapan pembayaran
└── app/(user)/
    ├── proyek/page.tsx                # Route list (proyek pertama + empty state)
    └── proyek/[id]/page.tsx           # Route detail
```

## 8. Cara Simulasi (belum ada backend)

Semua state hardcoded di src/data/proyek.ts. Ganti field berikut:

| Skenario demo | Setting |
|---|---|
| Kontrak menunggu tanda tangan | `status: "Kontrak Proyek"`, `contract.status: "menunggu"` |
| Kontrak disetujui, tunggu DP | `status: "Pembayaran DP"`, `contract.status: "disetujui"`, DP belum `lunas` |
| Kontrak kedaluwarsa | `contract.status: "kedaluwarsa"` |
| Loop revisi | `contract.status: "ditolak"` / `"revisi"` + `rejectionReasons`, `adminNotes` |
| Proyek aktif | `status: "Proyek Aktif"`, `contract.status: "disetujui"`, DP `lunas` |
| Belum ada tim | `team: []`, `status: "Alokasi Tim"` |

Deadline countdown juga relatif (`inDays()` / `agoDays()` helper di file data).

## 9. Checkpoint Implementasi

**Selesai:**
- [x] Milestone Kontrak Proyek di timeline (posisi baru)
- [x] ContractModal: dokumen formal + checkbox + setuju/tolak
- [x] Banner per status + countdown real-time
- [x] Loop revisi (banner + alasan + komentar admin)
- [x] Status kedaluwarsa + tombol ajukan ulang
- [x] Aturan kunci tombol Batalkan Proyek
- [x] List proyek + detail + empty state
- [x] ESLint & `tsc --noEmit` bersih

**Mock / placeholder (frontend-only):**
- [ ] Tombol Bayar DP / Bayar Cicilan / Pantau Progress belum terhubung apa pun
- [ ] Aksi setuju/tolak hanya toast lokal, tidak mengubah state global
- [ ] Nama pihak (PT Way2Home / Budi Santoso) hardcoded di `ContractModal.tsx`
- [ ] Print/Download pakai `window.print()` (mock)

**Backend (nanti):**
- [ ] API state machine status proyek & kontrak
- [ ] Persistensi tanda tangan kontrak & riwayat versi
- [ ] Integrasi pembayaran (Midtrans) untuk DP & cicilan

## 10. Konvensi

- Lint: `npx eslint <paths>` dan `npx tsc --noEmit` harus bersih sebelum commit.
- Bahasa UI: Indonesia. Format angka: `Intl.NumberFormat("id-ID")`.
- Palet tema: `#004796` (primary), `#045ec2` (accent), background `#f7f9fc`, teks `#111e3f`.
- Radius kartu `1.5rem`/`1.75rem`, tombol pill (rounded-full).
