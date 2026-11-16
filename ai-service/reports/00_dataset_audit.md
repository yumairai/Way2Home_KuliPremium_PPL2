# Way2Home — Audit Dataset Kendala Konstruksi (Tahap 1)

Tanggal audit: 12 November 2026. Status: menunggu persetujuan sebelum harmonisasi & training.

## 1. Ringkasan audit

| #   | Dataset                                            | File                                              | Baris × Kolom         | Granularitas                       | Target tersedia                               | Missing                                                   | Empiris/Sintetis             | Rekomendasi                                 |
| --- | -------------------------------------------------- | ------------------------------------------------- | --------------------- | ---------------------------------- | --------------------------------------------- | --------------------------------------------------------- | ---------------------------- | ------------------------------------------- |
| 1   | Aceh delay survey (Mendeley 10.17632/2wckhrzz5j.1) | Dataset_1.xlsx                                    | 68 × 64               | Survei (1 baris = 1 responden PM)  | Y1–Y4 (tidak terdokumentasi)                  | 0                                                         | **Empiris**                  | Knowledge base bobot faktor, tidak digabung |
| 2   | Simulated Project Risk — fitur mentah              | project_risk_raw_dataset.csv                      | 4.000 × 51            | Proyek (6 jenis; 797 Construction) | Risk_Level 4 kelas                            | Tech_Env_Stability 65%, Change_Control 20%, Risk_Mgmt 20% | Sintetis                     | Hanya eksperimen terpisah                   |
| 3   | Simulated EV — ringkasan                           | project_delay_cost_overrun_summary_final.csv.xlsx | 4.000 × 7             | Proyek                             | Schedule_Delay (bulan), Cost_Overrun (USD)    | 0                                                         | Simulasi                     | Jangan dipakai sebagai target               |
| 4   | Simulated EV — deret waktu                         | simulated_project_ev_metrics_final.csv.xlsx       | 72.549 × 15           | Proyek-bulan                       | sama dengan #3                                | 0                                                         | Simulasi                     | Tidak dipakai                               |
| 5   | Construction Project Delay Risk (GitHub)           | construction_projects.csv                         | 5.000 × 12            | Proyek                             | delay_risk L/M/H, delay_days, budget_variance | 0                                                         | Sintetis (tanpa dokumentasi) | Kandidat utama, subset terpisah             |
| 6   | BIM AI Civil Engineering (GitHub)                  | bim_ai_civil_engineering_dataset.csv              | 1.000 × 28            | Proyek (infrastruktur besar AS)    | Risk_Level, Cost_Overrun, Schedule_Deviation  | 0                                                         | Sintetis                     | Tidak layak untuk training                  |
| 7   | Construction Delay Prediction (Aljazair)           | synthetic_construction_projects.csv               | 1.000 × 15            | Proyek                             | Delay_Risk biner                              | 0                                                         | Sintetis (dinyatakan)        | Opsional, biner terpisah                    |
| 8   | RCPLIB (bukan DSLIB)                               | RCPLIB (Parameters and BKS).xlsx                  | 13.574 instance × 410 | Instance jadwal buatan             | Makespan terbaik (bukan keterlambatan)        | n/a                                                       | Benchmark artifisial         | Tidak relevan                               |

Duplikasi baris: 0 di semua dataset. Dua file "xlsx" simulasi EV sebenarnya teks CSV dalam satu kolom Excel.

## 2. Temuan kritis per dataset

**#1 Aceh (Rauzana & Dharma, PLOS ONE 2022).** 68 manajer proyek kontraktor di Aceh. Skala 1–5 = tingkat pengaruh faktor terhadap keterlambatan. Label 60 item (X1 Material … X10 Project Manager) terdokumentasi di artikel. Y1–Y4 tidak dijelaskan di artikel maupun halaman Mendeley; Y hanya bernilai 3–5, jadi variansnya sangat kecil. Ini data persepsi, bukan kejadian: tidak ada delay_days, biaya, atau label risiko per kendala.

**#2–#4 Simulated EV.** Ringkasan EV dihasilkan oleh `simulate_project_ev_metrics.py` dari #2 (4.000 Project_ID cocok; budget & timeline 100% identik). Schedule_Delay dan Cost_Overrun adalah rumus linear berbobot dari fitur ditambah noise. Model yang dilatih di sini hanya merekonstruksi rumus. Skrip juga punya bug encoding: nilai "Critical" (Risk_Level), "Mixed"/"Expert" (Team_Experience), dan "Basic"/"Excellent" (Documentation) tidak ada di mapping sehingga jadi 0. Project_Manager_Experience menjadi konstan. Akibatnya proyek "Critical" justru punya rata-rata delay terendah.

**#5 construction_projects.** `delay_risk` adalah ambang murni dari `delay_days` (Low 0–7, Medium 8–20, High ≥21), dan `budget_variance` = actual_cost − project_budget. Keduanya harus dikeluarkan dari fitur. Sinyal tanpa leakage (RF, 5-fold CV): delay_days R² ≈ 0,54; delay_risk macro-F1 ≈ 0,59; cost overrun % R² ≈ 0,01 (tidak ada sinyal). Durasi terdistribusi seragam 90–1.099 hari (uji KS p = 0,47), sehingga diperlakukan sebagai sintetis.

**#6 BIM.** Risk_Level dapat direproduksi 95,9% hanya dari Safety_Risk_Score + Anomaly_Detected, jadi akurasi ~97% di notebook asli berasal dari label berbasis aturan. Rasio Actual/Planned untuk biaya (0,9–1,5) dan durasi (0,9–1,5) terdistribusi seragam dan independen dari fitur. Overrun % R² ≈ −0,04 (noise). End_Date tidak konsisten dengan durasi rencana maupun aktual. Start_Date bertambah tepat 1 hari per baris.

**#7 Aljazair.** Target biner Yes/No, tanpa delay_days dan tanpa biaya aktual. Delay_Risk berasosiasi dengan ketersediaan material/alat, risiko cuaca, keterlambatan pemasok, dan kompleksitas (chi² p < 0,001). Macro-F1 ≈ 0,73.

**#8 RCPLIB.** Yang terlampir adalah RCPLIB (instance RCPSP buatan generator), bukan DSLIB (proyek empiris Vanhoucke/Batselier dengan baseline vs aktual). Tidak ada outcome keterlambatan atau biaya proyek nyata.

## 3. Kelayakan target

| Target             | Sumber valid                              | Catatan                                                                                                              |
| ------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| risk_level (L/M/H) | #5 (label dari delay_days, outcome-based) | Valid bila delay_days dikeluarkan dari fitur. #6 ditolak (aturan K3). #2 berisi 4 kelas dan bukan khusus konstruksi. |
| delay_days         | #5 (hari)                                 | Satu-satunya sumber hari keterlambatan yang punya sinyal. Semuanya sintetis.                                         |
| cost_overrun       | Tidak ada yang layak                      | #5 dan #6 tanpa sinyal, #3 hasil simulasi. Sesuai brief: **jangan dilatih**.                                         |

Tidak ada data empiris dengan outcome waktu atau biaya, sehingga validasi "empiris vs sintetis" untuk regresi tidak bisa dilakukan. Data empiris (Aceh) hanya bisa dipakai untuk konsistensi faktor, bukan untuk metrik akurasi.

## 4. Pemetaan ke input Way2Home

| Input Way2Home                                                  | Padanan semantik                                                                                                      | Kualitas                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| kategori                                                        | Kelompok faktor Aceh X1–X10; #5 material_delay/weather_delay/safety_incidents; #7 Material/Equipment/Weather/Supplier | Sedang. Perlu daftar enum kategori Way2Home.         |
| dampak_waktu_hari                                               | #5 material_delay_days, weather_delay_days (hari keterlambatan per penyebab)                                          | Lemah–sedang. Itu agregat proyek, bukan per kendala. |
| status_proyek                                                   | #5 completion_percentage, #7 Project_Progress_Percent                                                                 | Lemah. Perlu enum status Way2Home.                   |
| nama_tahap                                                      | #2 Project_Phase (Initiation/Planning/Execution…)                                                                     | Lemah. Bukan tahap konstruksi rumah.                 |
| deskripsi, kondisi_pekerjaan, informasi_tambahan, judul_subtask | Tidak ada (tidak ada teks bebas di dataset mana pun)                                                                  | Tidak ada padanan                                    |
| bobot_subtask, nama_desain                                      | Tidak ada                                                                                                             | Tidak ada padanan                                    |

Fitur penting di #5 (budget, worker_count, equipment_utilization, project_duration_days) **tidak tersedia** di input Way2Home. Jadi model #5 tidak bisa langsung dipanggil dari `ai-kendala.service.ts` tanpa menambah input, padahal brief melarang perubahan input.

## 5. Rekomendasi

1. Jangan membuat satu tabel gabungan "baris = kendala". Tidak ada dataset issue-level, dan granularitas maupun semantik target berbeda. `way2home_kendala_training.csv` dibuat sebagai tabel longgar (stacked) dengan `source_dataset`, `data_granularity`, `is_synthetic`. Kolom yang tidak ada padanannya diisi NaN, dan setiap model dilatih per subset yang valid.
2. Subset A (#5): risk_level & delay_days dengan fitur yang bisa dipetakan ke Way2Home (penyebab material/cuaca/K3, hari dampak, progres), plus varian "full features" sebagai pembanding.
3. Subset B (#7): klasifikasi biner risiko keterlambatan sebagai validasi silang pola faktor.
4. Knowledge base Aceh (#1): ranking pengaruh faktor per kategori sebagai dasar `checklist_factors` yang dapat ditelusuri.
5. cost_overrun: tidak dilatih. `metrics.overbudget_risk` dan `cost_notes` tetap memakai logika sekarang, diberi catatan keterbatasan data.
6. Dikeluarkan: #3/#4 (circular + bug), #6 (label aturan, target noise), #8 (tidak relevan).
7. Jangka panjang: data riwayat kendala Way2Home sendiri (Supabase) beserta outcome aktualnya adalah satu-satunya jalan ke model yang benar-benar valid untuk konteks rumah tinggal.

## 6. Kendala lingkungan

XGBoost, CatBoost, dan SHAP tidak terpasang dan instalasi paket diblokir di sesi ini. Yang tersedia: scikit-learn 1.9, pandas 3.0, matplotlib, seaborn. Butuh pengaturan jaringan diubah (berlaku di chat baru), atau training gradient boosting/SHAP dijalankan di mesin Anda/Colab dengan notebook yang saya siapkan.

## Sumber

- Rauzana A., Dharma W. (2022). Causes of delays in construction projects in the Province of Aceh, Indonesia. PLOS ONE 17(1): e0263337. https://pmc.ncbi.nlm.nih.gov/articles/PMC8797244
- Dataset: https://data.mendeley.com/datasets/2wckhrzz5j/1
