# Spesifikasi Sistem Tracking & Verifikasi Progress Proyek Way2Home

Dokumen ini mendefinisikan hirarki, alur bisnis verifikasi, breakdown bobot milestone, skema database, dan logika kalkulasi progres untuk platform **Way2Home**. Dokumentasi ini dirancang agar siap diimplementasikan oleh developer maupun AI coding agent (OpenCode / LLM Harness).

---

## 1. Konsep Hirarki Progress

Perhitungan progres fisik pembangunan rumah pada platform **Way2Home** bersifat bottom-up dengan hirarki sebagai berikut:

$$\text{Subtask Done} \longrightarrow \text{Progress Milestone} \longrightarrow \text{Progress Keseluruhan Proyek}$$

1. **Subtask (Atas Persetujuan Verifikasi):** Unit pekerjaan terkecil yang dilaporkan oleh Mandor beserta bukti foto/catatan.
2. **Progress Milestone:** Akumulasi persentase dari subtask-subtask yang telah berstatus `APPROVED` di dalam milestone tersebut.
3. **Progress Keseluruhan Proyek:** Akumulasi total dari seluruh persentase milestone yang sudah terisi (Mencapai maks $100\%$).

---

## 2. Alur Bisnis Verifikasi (Workflow)

```
 [Mandor]                           [Pengawas]                       [Sistem Way2Home]
    │                                   │                                    │
    ├─── 1. Submit Laporan Subtask ────>│                                    │
    │    (Bukti Foto + Catatan)         │                                    │
    │                                   ├─── 2. Review Laporan & Foto ──────>│
    │                                   │                                    │
    │                                   ├─── 3a. REJECT (Minta Revisi) ─────>│ Status: REJECTED
    │                                   │                                    │ (Mandor Upload Ulang)
    │                                   │                                    │
    │                                   └─── 3b. APPROVE (Verifikasi) ──────>│ Status: APPROVED
    │                                                                        │
    │                                                                        ├─── 4. Mark Subtask DONE
    │                                                                        ├─── 5. Auto-recalculate Milestone
    │                                                                        └─── 6. Auto-recalculate Total
```

### Langkah Operasional:

1. **Mandor (Submit):** FORM TAHAPAN/MILESTONE(misalnya tahapan lagi di mana) Lalu Mandor memilih subtask yang dikerjakan(jika subtask sudah selesai, tidak bisa dipilih lagi), mengunggah bukti foto lapangan, dan menuliskan catatan progress melalui form laporan. Subtask berada pada status `PENDING_VERIFICATION`.
2. **Pengawas (Review):** Pengawas memeriksa kesesuaian foto dengan fisik di lapangan.
3. **Keputusan Verifikasi:**
   - **REJECTED:** Pengawas memberikan catatan penolakan. Mandor wajib melakukan _resubmit_.
   - **APPROVED:** Pengawas mengonfirmasi bahwa pekerjaan telah sesuai standar.
4. **Auto-Update Sistem:**
   - Subtask berubah menjadi `COMPLETED`.
   - Sistem otomatis menghitung ulang progres milestone terkait.
   - Sistem otomatis menghitung total progres keseluruhan proyek ($0\% - 100\%$).

---

## 3. Tabel Breakdown 6 Milestone & Bobot Subtask

Total progres resmi pembangunan rumah dibatasi tepat pada **100.00%**. Setiap subtask dalam milestone membagi rata bobot milestone tersebut.

| ID Milestone | Milestone & Deskripsi                                | Subtask                                                                                                                                                |               Bobot Subtask               | Total Bobot Milestone |
| :----------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------: | :-------------------: |
| **M1**       | **🏠 Milestone 1: Pekerjaan Persiapan & Fondasi**    | • Pembersihan Lahan<br>• Pengukuran (_Bowplank_)<br>• Galian Tanah<br>• Pengecoran Fondasi & Sloof                                                     |     3.75%<br>3.75%<br>3.75%<br>3.75%      |      **15.00%**       |
| **M2**       | **🏗️ Milestone 2: Pekerjaan Struktur Utama**         | • Pengerjaan Kolom (Tiang)<br>• Pengerjaan Balok<br>• Pelat Lantai (Jika 2 lantai)<br>• Rangka Atap                                                    |     5.00%<br>5.00%<br>5.00%<br>5.00%      |      **20.00%**       |
| **M3**       | **🧱 Milestone 3: Pekerjaan Dinding & Penutup Atap** | • Pemasangan Bata<br>• Plesteran Awal<br>• Pengerjaan Kusen<br>• Pemasangan Genteng / Atap                                                             |     5.00%<br>5.00%<br>5.00%<br>5.00%      |      **20.00%**       |
| **M4**       | **🔌 Milestone 4: Instalasi Jalur MEP**              | • Penanaman Pipa Air Bersih & Kotor<br>• Pipa Kabel Listrik Dinding<br>• Pembuatan _Septic Tank_                                                       |          5.00%<br>5.00%<br>5.00%          |      **15.00%**       |
| **M5**       | **✨ Milestone 5: Pekerjaan Finishing**              | • Acian Dinding<br>• Pemasangan Keramik / Granit<br>• Pemasangan Plafon<br>• Pengecatan Interior & Eksterior<br>• Pemasangan Lampu, Keran & Sanitari   | 4.00%<br>4.00%<br>4.00%<br>4.00%<br>4.00% |      **20.00%**       |
| **M6**       | **🔑 Milestone 6: Lingkungan Luar & Serah Terima**   | • Pengerjaan Pagar & _Carport_<br>• Pembuatan Taman<br>• Pembersihan Total (_Final Cleaning_)<br>• Inspeksi Komplain (_Punch List_) & Penyerahan Kunci |     2.50%<br>2.50%<br>2.50%<br>2.50%      |      **10.00%**       |
| **TOTAL**    | **KONTRIBUSI KESELURUHAN PROYEK**                    |                                                                                                                                                        |                                           |      **100.00%**      |

---

## 4. Skema Database & Data Structure (BUAT TIM BACKEND NANTI, KHUSUS FRONTEND TIDAK PERLU INI)

### A. Database Relational Schema (PostgreSQL / Supabase)

```sql
-- 1. Table Proyek (Ringkasan Total Progress Cache)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    overall_progress DECIMAL(5,2) DEFAULT 0.00, -- Auto updated (0.00 - 100.00)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table Milestone Proyek
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL, -- M1, M2, M3, M4, M5, M6
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL, -- e.g. 15.00, 20.00
    progress DECIMAL(5,2) DEFAULT 0.00, -- Current milestone progress
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table Subtask Milestone
CREATE TABLE project_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL, -- e.g. 3.75, 5.00
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table Laporan Progress (Submission Mandor & Approval Pengawas)
CREATE TABLE progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtask_id UUID REFERENCES project_subtasks(id) ON DELETE CASCADE,
    mandor_id UUID NOT NULL,
    supervisor_id UUID NULL,
    photo_url TEXT NOT NULL,
    mandor_notes TEXT,
    supervisor_notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, APPROVED, REJECTED
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### B. JSON Representation (Engine Payload / API Response)

```json
{
  "project_id": "8f2b3e4a-1a2b-4c3d-8e5f-9a0b1c2d3e4f",
  "project_name": "Pembangunan Rumah Bapak Budi - Tipe 70",
  "overall_progress": 35.0,
  "milestones": [
    {
      "code": "M1",
      "name": "Pekerjaan Persiapan & Fondasi",
      "weight": 15.0,
      "milestone_progress": 15.0,
      "status": "COMPLETED",
      "subtasks": [
        {
          "id": "sub-101",
          "name": "Pembersihan Lahan",
          "weight": 3.75,
          "is_completed": true
        },
        {
          "id": "sub-102",
          "name": "Pengukuran (Bowplank)",
          "weight": 3.75,
          "is_completed": true
        },
        {
          "id": "sub-103",
          "name": "Galian Tanah",
          "weight": 3.75,
          "is_completed": true
        },
        {
          "id": "sub-104",
          "name": "Pengecoran Fondasi & Sloof",
          "weight": 3.75,
          "is_completed": true
        }
      ]
    },
    {
      "code": "M2",
      "name": "Pekerjaan Struktur Utama",
      "weight": 20.0,
      "milestone_progress": 10.0,
      "status": "IN_PROGRESS",
      "subtasks": [
        {
          "id": "sub-201",
          "name": "Pengerjaan Kolom (Tiang)",
          "weight": 5.0,
          "is_completed": true
        },
        {
          "id": "sub-202",
          "name": "Pengerjaan Balok",
          "weight": 5.0,
          "is_completed": true
        },
        {
          "id": "sub-203",
          "name": "Pelat Lantai",
          "weight": 5.0,
          "is_completed": false
        },
        {
          "id": "sub-204",
          "name": "Rangka Atap",
          "weight": 5.0,
          "is_completed": false
        }
      ]
    }
  ]
}
```
