# Spesifikasi Sistem Laporan Kendala & Analisis AI (Way2Home)

Dokumen ini mendefinisikan alur pelaporan kendala proyek, peran AI analisis risiko, spesifikasi form UI Mandor, UI Dashboard Pengawas, serta kriteria persetujuan Customer untuk platform **Way2Home**. Dokumentasi ini disiapkan agar dapat dipahami oleh tim developer maupun AI coding harness.

---

## 1. Alur Kerja Utama (Workflow)

```
[Mandor]                        [Pengawas]                      [AI Engine]               [Customer]
   │                                │                                │                        │
   ├── 1. Submit Laporan Kendala ──>│                                │                        │
   │    (Kategori, Detail, Impact)  │                                │                        │
   │                                ├── 2. Trigger Analisis AI ─────>│                        │
   │                                │    (Kirim context data)        │                        │
   │                                │<── 3. Return Hasil Analisis ───┤                        │
   │                                │    (Ringkasan, Risiko, Opsi)   │                        │
   │                                │                                │                        │
   │                                ├── 4. Evaluasi & Input Solusi ──┼───────────────────────>│
   │                                │    (Pilih/Isi Solusi, Cost)    │   5. Notifikasi Solusi │
   │                                │                                │      & Need Approval   │
   │                                │<───────────────────────────────┼───────── 6. Approve ──┤
   │                                │                                │                        │
   │<── 7. Notifikasi Instruksi ────┴────────────────────────────────┴────────────────────────┘
```

### Langkah-Langkah Operasional:

1. **Mandor Melaporkan Kendala:** Mandor mengisi form laporan terstruktur di lokasi proyek (pilih kategori, detail, kondisi pekerjaan, estimasi waktu, dan foto bukti).
2. **Pengawas Memicu Analisis AI:** Pengawas membuka laporan kendala dan menekan tombol **"Analisis Kendala (AI)"**.
3. **AI Menganalisis Dampak:** Sistem AI memproses data laporan beserta konteks jadwal & progres proyek untuk memprediksi tingkat risiko keterlambatan, potensi overbudget, dan menyarankan 2–3 opsi solusi.
4. **Pengawas Menetapkan Keputusan:** Pengawas meninjau saran AI, memilih/menuliskan solusi, menentukan estimasi biaya tambahan & durasi, serta menetapkan tingkat persetujuan.
5. **Eskalasi ke Customer (Jika Diperlukan):** Jika solusi membutuhkan biaya tambahan di luar budget atau mengubah kontrak/spesifikasi, laporan diteruskan ke Customer untuk persetujuan (_Approval_).

---

## 2. Kategori Kendala (Fixed Enum)

Kategori bersifat _fixed_ agar laporan konsisten dan memudahkan pengolahan data oleh AI:

| Kode Enum             | Nama Kategori                 | Contoh Kendala                                                       |
| :-------------------- | :---------------------------- | :------------------------------------------------------------------- |
| `CUACA_LINGKUNGAN`    | Cuaca dan lingkungan          | Hujan deras, banjir, kondisi tanah tidak stabil                      |
| `MATERIAL_PERALATAN`  | Material dan peralatan        | Material habis, keterlambatan pengiriman, alat rusak                 |
| `TENAGA_KERJA`        | Tenaga kerja                  | Tukang kurang, tenaga kerja tidak hadir                              |
| `TEKNIS_KONSTRUKSI`   | Teknis konstruksi             | Pekerjaan tidak sesuai spesifikasi, perlu pekerjaan ulang (_rework_) |
| `DESAIN_SPESIFIKASI`  | Desain dan spesifikasi        | Perubahan desain dari client, ketidaksesuaian gambar kerja           |
| `ANGGARAN_PENGADAAN`  | Anggaran dan pengadaan        | Harga material naik, dana pengadaan belum cair                       |
| `PERIZINAN_EKSTERNAL` | Perizinan dan pihak eksternal | Izin RT/RW/Masyarakat belum selesai, kendala supplier                |
| `LAINNYA`             | Lainnya                       | Kendala tak terduga yang tidak masuk kategori di atas                |

---

## 3. UI Mandor — Form Laporan Kendala

Form didesain bertahap agar tidak memberatkan Mandor di lapangan. Mandor **tidak mengisi** analisis biaya atau keputusan akhir.

### Field Specification:

- **Kategori Kendala** _(Radio / Select, Required)_: Salah satu dari 8 kategori enum.
- **Detail Kendala** _(Textarea, Required)_: Penjelasan konkret kendala di lapangan (misal: _"Pengiriman semen terlambat sehingga pekerjaan pasangan dinding berpotensi tertunda"_).
- **Pekerjaan yang Terdampak** _(Select/Dropdown, Required)_: Mengambil daftar Subtask/Milestone yang sedang aktif (misal: Pekerjaan Pasangan Dinding).
- **Kondisi Pekerjaan Saat Ini** _(Radio, Required)_:
  - `BERJALAN`: Pekerjaan tetap berjalan dengan penyesuaian.
  - `TERHAMBAT_SEBAGIAN`: Produktivitas menurun/berkurang.
  - `BERHENTI`: Pekerjaan terhenti total.
- **Perkiraan Tambahan Waktu** _(Range Slider 0 - 30 hari)_: Perkiraan awal dari Mandor (misal: 3 hari). _(Terdapat disclaimer: "Perkiraan awal Mandor, bukan hasil final AI")_.
- **Informasi Tambahan** _(Textarea, Optional)_: Catatan khusus (misal: _"Pemasok menjanjikan pengiriman ulang hari Jumat"_).
- **Bukti Pendukung** _(File Upload, Optional)_: Lampiran foto, nota, atau dokumen lapangan.

---

## 4. UI Pengawas — Kartu Hasil Analisis AI

Tampilan hasil AI muncul setelah Pengawas menekan tombol **"Analisis Kendala (AI)"**.

### Komponen UI Hasil AI:

1. **Header & Badge Risiko:**
   - Judul Laporan & Kategori
   - Badge Tingkat Risiko: `Risiko Tinggi` (Merah), `Risiko Sedang` (Kuning), `Risiko Rendah` (Hijau).
2. **Ringkasan Analisis AI:** Penjelasan naratif mengenai potensi efek domino kendala terhadap target proyek.
3. **Kartu Metric Estimasi:**
   - **Potensi Keterlambatan:** Rentang estimasi hari (misal: `3–5 hari`).
   - **Potensi Biaya Tambahan:** Estimasi biaya atau label `Belum cukup data` (jika data material/biaya belum diinput).
4. **Faktor yang Perlu Diperiksa (Checklist):** Point-point verifikasi lapangan untuk Pengawas (misal: Ketersediaan material, Dampak ke jadwal).
5. **Opsi Penanganan yang Disarankannya (2-3 Cards):**
   - **Opsi A (Utama):** Solusi prioritas beserta estimasi dampaknya.
   - **Opsi B & C:** Solusi alternatif (misal: _"Atur ulang urutan pekerjaan"_, _"Sesuaikan jadwal pengiriman"_).
6. **Guardrails / Keterbatasan Analisis:**
   - _Prinsip:_ AI tidak boleh mengarang angka biaya/durasi. Jika data tidak lengkap, tampilkan `"Belum cukup data untuk estimasi"`.

---

## 5. UI Pengawas — Decision & Cost Management (Keputusan Penanganan)

Form yang diisi Pengawas setelah meninjau rekomendasi AI:

### Field Specification:

- **Solusi yang Dipilih** _(Radio Options)_:
  - Opsi A (dari AI)
  - Opsi B (dari AI)
  - Opsi C (dari AI)
  - `Solusi Lain` (Input manual via Textarea)
- **Dampak Keputusan & Keuangan:**
  - **Status Tambahan Dana** _(Checkbox/Toggle)_: `Solusi membutuhkan tambahan dana`
  - **Estimasi Tambahan Dana (Rp)** _(Currency Input)_: Diisi nominal nyata (misal: `Rp 2.500.000`). _(Berasal dari penawaran real, bukan tebakan AI)_.
  - **Sumber / Penanggung Jawab Dana** _(Select)_: e.g., "Dana Proyek melalui Pengawas", "Eskalasi ke Customer".
  - **Estimasi Dampak Durasi (Hari)** _(Number Input)_: Penyesuaian durasi final (misal: `2 hari`).
- **Status Persetujuan (Approval Flow Level):**
  - `PERLU_PERSETUJUAN_CUSTOMER`: Jika ada tambahan biaya di luar anggaran atau perubahan spesifikasi/kontrak.
  - `PERLU_KOORDINASI_ADMIN`: Jika membutuhkan penyesuaian internal/logistik skala besar.
  - `DALAM_KEWENANGAN_PENGAWAS`: Jika tidak ada biaya tambahan & tidak mengubah kontrak.
- **Alasan Keputusan / Catatan untuk Mandor** _(Textarea)_: Instruksi rinci tindakan untuk tim lapangan.

---

## 6. Matrix Kriteria Persetujuan Customer (Eskalasi)

Sistem akan otomatis menentukan apakah keputusan penanganan harus dikirim ke Customer berdasarkan kriteria berikut:

| Kondisi Keputusan                          | Butuh Approval Customer? | Tindakan Sistem                                                                                         |
| :----------------------------------------- | :----------------------: | :------------------------------------------------------------------------------------------------------ |
| **Ada Tambahan Biaya** (Estimasi dana > 0) |          **YA**          | Status laporan -> `WAITING_CUSTOMER_APPROVAL`. Customer mendapat notifikasi persetujuan biaya.          |
| **Perubahan Spesifikasi / Desain**         |          **YA**          | Status laporan -> `WAITING_CUSTOMER_APPROVAL`. Rincian revisi dikirim ke Customer.                      |
| **Perubahan Target Perjanjian Kontrak**    |          **YA**          | Adendum jadwal dikirimkan ke Customer untuk disetujui.                                                  |
| **Tanpa Biaya & Dalam Scope Kontrak**      |        **TIDAK**         | Status laporan -> `APPROVED_BY_SUPERVISOR`. Langsung menjadi instruksi kerja Mandor.                    |
| **Keadaan Darurat / Keselamatan**          |  **TIDAK (Immediate)**   | Tindakan langsung dieksekusi di lapangan; laporan pencatatan dikirim ke Customer sebagai pemberitahuan. |

---

## 7. Skema Database (Supabase / PostgreSQL)

### Tabel `project_issues` (Laporan Kendala)

```sql
CREATE TYPE issue_category_enum AS ENUM (
    'CUACA_LINGKUNGAN', 'MATERIAL_PERALATAN', 'TENAGA_KERJA',
    'TEKNIS_KONSTRUKSI', 'DESAIN_SPESIFIKASI', 'ANGGARAN_PENGADAAN',
    'PERIZINAN_EKSTERNAL', 'LAINNYA'
);

CREATE TYPE work_condition_enum AS ENUM ('BERJALAN', 'TERHAMBAT_SEBAGIAN', 'BERHENTI');
CREATE TYPE approval_status_enum AS ENUM ('SUBMITTED', 'ANALYZED_BY_AI', 'PENDING_CUSTOMER', 'APPROVED', 'REJECTED');

CREATE TABLE project_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id), -- Mandor
    supervisor_id UUID REFERENCES users(id), -- Pengawas

    -- Inputs from Mandor
    category issue_category_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_subtask_id UUID REFERENCES project_subtasks(id),
    work_condition work_condition_enum NOT NULL DEFAULT 'BERJALAN',
    mandor_estimated_delay_days INT DEFAULT 0,
    additional_info TEXT,
    attachment_paths JSONB DEFAULT '[]'::jsonb,

    -- AI Analysis Output (JSON Cache)
    ai_analysis_result JSONB DEFAULT NULL,
    ai_analyzed_at TIMESTAMP WITH TIME ZONE,

    -- Decision Inputs from Supervisor
    selected_solution_type VARCHAR(50), -- 'OPTION_A', 'OPTION_B', 'MANUAL'
    final_solution_description TEXT,
    requires_additional_funds BOOLEAN DEFAULT FALSE,
    estimated_additional_cost NUMERIC(15, 2) DEFAULT 0.00,
    cost_bearer VARCHAR(100),
    final_impact_days INT DEFAULT 0,
    approval_level VARCHAR(50), -- 'SUPERVISOR_ONLY', 'CUSTOMER_APPROVAL_REQUIRED'
    supervisor_notes TEXT,

    -- Status Tracking
    status approval_status_enum DEFAULT 'SUBMITTED',
    customer_approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Format Payload JSON Hasil AI (`ai_analysis_result`)

```json
{
  "risk_level": "HIGH",
  "summary": "Keterlambatan pengiriman material dapat menghambat pekerjaan pasangan dinding...",
  "metrics": {
    "delay_estimate_days": "3-5 hari",
    "overbudget_risk": "BELUM_CUKUP_DATA",
    "cost_notes": "Perlu harga dan kebutuhan material real"
  },
  "checklist_factors": [
    "Periksa stok yang tersisa dan jadwal pengiriman pemasok.",
    "Periksa apakah pekerjaan lain bisa berjalan tanpa material tersebut."
  ],
  "recommended_options": [
    {
      "id": "OPTION_A",
      "title": "Cari pemasok alternatif",
      "is_primary": true,
      "description": "Periksa ketersediaan material dari pemasok lain dan bandingkan harga serta waktu pengiriman.",
      "cost_impact": "Perlu dihitung dari penawaran pemasok"
    },
    {
      "id": "OPTION_B",
      "title": "Atur ulang urutan pekerjaan",
      "is_primary": false,
      "description": "Kerjakan tahapan lain yang tidak bergantung pada material tersebut.",
      "cost_impact": "Belum dapat ditentukan"
    }
  ]
}
```
