/**
 * ai-kendala.service.ts
 *
 * Layanan analisis kendala proyek berbasis AI (AI Engine) Way2Home:
 * 1. Risk Level: Random Forest classification (HIGH / MEDIUM / LOW) via FastAPI w2h_compatible.
 * 2. Estimasi Keterlambatan: HistGradientBoosting regression (ClippedRegressor >= 0 hari) via FastAPI.
 * 3. Risiko Pembengkakan Biaya: Rule-Based (HIGH / MEDIUM / LOW / BELUM DAPAT DINILAI) dengan cost_notes faktual tanpa nominal buatan.
 * 4. Ringkasan, faktor checklist pengawas, dan opsi rekomendasi mitigasi tetap menggunakan Rule-Based sesuai konteks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireRole, ServiceError } from "./access.service";

export type CostRiskLevel = "HIGH" | "MEDIUM" | "LOW" | "BELUM DAPAT DINILAI";

export type IssueAiAnalysisResult = {
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  metrics: {
    delay_estimate_days: string;
    overbudget_risk: CostRiskLevel | string;
    cost_notes: string;
  };
  checklist_factors: string[];
  recommended_options: {
    id: string;
    title: string;
    is_primary: boolean;
    description: string;
    cost_impact: string;
    requires_approval: boolean;
  }[];
};

type KendalaRow = Record<string, unknown>;

interface FastAiPredictResponse {
  success: boolean;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  risk_proba: Record<string, number>;
  delay_days: number;
  missing_features?: Record<string, string[]>;
}

/**
 * Panggil FastAPI AI Service untuk mendapatkan inferensi model Random Forest & HistGradientBoosting.
 */
async function callAiKendalaService(payload: {
  kategori: string;
  dampak_waktu_hari?: number | null;
  deskripsi?: string | null;
  kondisi_pekerjaan?: string | null;
  informasi_tambahan?: string | null;
  progress_persen?: number | null;
}): Promise<FastAiPredictResponse | null> {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${aiServiceUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(
        `[AI Kendala] FastAPI /predict returned status ${res.status}`,
      );
      return null;
    }
    const data = (await res.json()) as FastAiPredictResponse;
    return data;
  } catch (error) {
    console.warn(
      "[AI Kendala] Gagal terhubung ke FastAPI AI Service, beralih ke analisis fallback:",
      error,
    );
    return null;
  }
}

/**
 * Analisis Risiko Pembengkakan Biaya (Rule-Based, bukan Machine Learning).
 *
 * Aturan evaluasi:
 * - HIGH: membutuhkan penggantian material, tambahan tenaga kerja atau alat,
 *   pengerjaan ulang, atau perubahan spesifikasi yang menambah sumber daya.
 * - MEDIUM: berpotensi membutuhkan sumber daya tambahan, tetapi dampaknya belum pasti.
 * - LOW: tidak menunjukkan indikasi kebutuhan biaya tambahan.
 * - BELUM DAPAT DINILAI: informasi kendala tidak mencukupi.
 * - Isi cost_notes berdasarkan alasan faktual dari kendala tanpa mengarang nominal biaya.
 */
export function analyzeCostRisk(
  kategori: string,
  deskripsi: string,
  kondisi: string,
  infoTambahan: string,
): { overbudget_risk: CostRiskLevel; cost_notes: string } {
  const text = `${deskripsi} ${infoTambahan}`.toLowerCase().trim();

  // 1. BELUM DAPAT DINILAI: Informasi kendala tidak mencukupi
  if (
    text.length < 12 ||
    /^(ada kendala|kendala|masalah|rusak|error|-|\.)+$/i.test(text)
  ) {
    return {
      overbudget_risk: "BELUM DAPAT DINILAI",
      cost_notes:
        "Informasi kendala belum mencukupi untuk menilai potensi dampak biaya. Diperlukan rincian teknis, kuantitas kerusakan, atau kondisi fisik material dari lapangan.",
    };
  }

  // Deteksi indikator HIGH
  // a. Penggantian material
  const hasMaterialReplacement =
    /ganti material|penggantian material|material rusak|material cacat|material pecah|material tidak sesuai|beli ulang|pesan ulang material|supplier baru|pemasok cadangan/i.test(
      text,
    );

  // b. Tambahan tenaga kerja atau alat
  const hasExtraLaborOrEquipment =
    /tambah tukang|tambah pekerja|tambah tenaga|sewa alat|alat tambahan|sewa alat berat|alat rusak|lembur berbayar/i.test(
      text,
    );

  // c. Pengerjaan ulang (rework)
  const hasRework =
    /pengerjaan ulang|rework|bongkar|bobok|cor ulang|plester ulang|pasang ulang|cat ulang|kerjakan ulang|ambruk|retak struktur/i.test(
      text,
    );

  // d. Perubahan spesifikasi yang menambah sumber daya
  const hasSpecChange =
    /ubah spesifikasi|perubahan spesifikasi|perubahan desain|tambah spek|penambahan volume|tambah struktur|spesifikasi lebih tinggi/i.test(
      text,
    );

  // e. Kategori kritis dengan kondisi BERHENTI yang mengindikasikan implikasi biaya
  const isHighSeverityCategory =
    (kategori === "MATERIAL_PERALATAN" ||
      kategori === "TEKNIS_KONSTRUKSI" ||
      kategori === "DESAIN_SPESIFIKASI") &&
    kondisi === "BERHENTI" &&
    (hasMaterialReplacement || hasRework || hasSpecChange);

  if (
    hasMaterialReplacement ||
    hasExtraLaborOrEquipment ||
    hasRework ||
    hasSpecChange ||
    isHighSeverityCategory
  ) {
    const reasons: string[] = [];
    if (hasMaterialReplacement)
      reasons.push(
        "kebutuhan penggantian material yang rusak atau tidak sesuai spesifikasi",
      );
    if (hasExtraLaborOrEquipment)
      reasons.push(
        "kebutuhan penambahan tenaga kerja atau penyewaan alat pendukung lapangan",
      );
    if (hasRework)
      reasons.push(
        "pelaksanaan pengerjaan ulang (rework) pada elemen konstruksi terdampak",
      );
    if (hasSpecChange)
      reasons.push(
        "penyesuaian spesifikasi atau perubahan desain yang menambah alokasi sumber daya",
      );
    if (reasons.length === 0)
      reasons.push(
        "kendala teknis kritis yang berimplikasi langsung pada biaya pekerjaan",
      );

    return {
      overbudget_risk: "HIGH",
      cost_notes: `Terindikasi risiko biaya tinggi akibat ${reasons.join(", ")}.`,
    };
  }

  // 2. MEDIUM: Berpotensi membutuhkan sumber daya tambahan, tetapi dampaknya belum pasti
  const hasMediumIndicators =
    /potensi|kemungkinan|tertunda|terlambat|menunggu stok|stok menipis|terhambat|antre|penurunan produktivitas|jadwal ulang/i.test(
      text,
    );

  if (
    hasMediumIndicators ||
    kondisi === "TERHAMBAT_SEBAGIAN" ||
    kategori === "MATERIAL_PERALATAN" ||
    kategori === "TENAGA_KERJA"
  ) {
    let reasonNote =
      "Keterlambatan atau kendala operasional berpotensi menimbulkan biaya overhead waktu atau penyesuaian jam kerja, namun kebutuhan belanja baru belum dapat dipastikan.";
    if (kategori === "MATERIAL_PERALATAN") {
      reasonNote =
        "Keterlambatan pengiriman material berpotensi memperpanjang durasi kerja, namun belum terkonfirmasi adanya selisih harga atau pembelian material pengganti.";
    } else if (kategori === "TENAGA_KERJA") {
      reasonNote =
        "Penurunan kapasitas tukang berpotensi memerlukan penyesuaian rotasi kerja atau lembur terarah, tanpa komitmen biaya borongan baru.";
    } else if (kategori === "CUACA_LINGKUNGAN") {
      reasonNote =
        "Kondisi cuaca dapat menunda jadwal kerja dan berpotensi membutuhkan penanganan proteksi area kerja, namun tidak terindikasi kerusakan fisik struktural.";
    }

    return {
      overbudget_risk: "MEDIUM",
      cost_notes: reasonNote,
    };
  }

  // 3. LOW: Tidak menunjukkan indikasi kebutuhan biaya tambahan
  return {
    overbudget_risk: "LOW",
    cost_notes:
      "Kendala dapat ditangani melalui penataan urutan kerja atau koordinasi lapangan tanpa indikasi kebutuhan biaya tambahan.",
  };
}

export async function generateIssueAiAnalysis(
  supabase: SupabaseClient<Database>,
  kendalaId: string,
): Promise<IssueAiAnalysisResult> {
  const { user } = await requireRole(supabase, "pengawas");

  const { data: kendala, error: kendalaErr } = await supabase
    .from("kendala")
    .select(
      `
      id,
      project_id,
      kategori,
      deskripsi,
      kondisi_pekerjaan,
      dampak_waktu_hari,
      informasi_tambahan,
      project_stages ( id, nama_tahap ),
      project_subtasks ( id, judul, bobot ),
      projects (
        id,
        pengawas_id,
        status,
        designs ( nama )
      )
    `,
    )
    .eq("id", kendalaId)
    .maybeSingle();

  if (kendalaErr || !kendala) {
    throw new ServiceError("Kendala tidak ditemukan.", 404);
  }

  const kRow = kendala as unknown as KendalaRow;
  const project = (kRow.projects ?? {}) as KendalaRow;
  if (project.pengawas_id !== user.id) {
    throw new ServiceError(
      "Anda tidak memiliki izin mengawasi proyek ini.",
      403,
    );
  }

  const stage = (kRow.project_stages ?? {}) as KendalaRow;
  const subtask = (kRow.project_subtasks ?? {}) as KendalaRow;
  const design = (project.designs ?? {}) as KendalaRow;

  const kategori = String(kRow.kategori ?? "LAINNYA");
  const deskripsi = String(kRow.deskripsi ?? "");
  const kondisi = String(kRow.kondisi_pekerjaan ?? "BERJALAN");
  const delayMandor = Number(kRow.dampak_waktu_hari ?? 0);
  const infoTambahan = kRow.informasi_tambahan
    ? String(kRow.informasi_tambahan)
    : "";
  const stageName = stage.nama_tahap
    ? String(stage.nama_tahap)
    : "Pekerjaan konstruksi";
  const subtaskTitle = subtask.judul
    ? String(subtask.judul)
    : "Pekerjaan lapangan";
  const designName = design.nama ? String(design.nama) : "Proyek Rumah";

  // Hitung progres proyek aktual dari subtask selesai (untuk fitur ML progress_persen)
  let projectProgressPercent: number | null = null;
  const projectIdStr = String(project.id ?? "");
  if (projectIdStr) {
    try {
      const { data: subtaskList } = await supabase
        .from("project_subtasks")
        .select("bobot, selesai, project_stages!inner(project_id)")
        .eq("project_stages.project_id", projectIdStr);

      if (subtaskList && subtaskList.length > 0) {
        const completedWeight = subtaskList
          .filter((st) => Boolean(st.selesai))
          .reduce((sum, st) => sum + Number(st.bobot ?? 0), 0);
        projectProgressPercent = Math.min(100, Math.max(0, completedWeight));
      }
    } catch (err) {
      // Biarkan progress_persen null agar ditangani imputer sebagai NaN (tidak diisi nilai nol sembarangan)
      console.warn(
        "[AI Kendala] Progres proyek belum dapat dihitung, diserahkan ke imputer model:",
        err,
      );
    }
  }

  // Panggil FastAPI AI Service untuk model Random Forest & HistGradientBoosting
  const aiPred = await callAiKendalaService({
    kategori,
    dampak_waktu_hari: delayMandor > 0 ? delayMandor : null,
    deskripsi,
    kondisi_pekerjaan: kondisi,
    informasi_tambahan: infoTambahan,
    progress_persen: projectProgressPercent,
  });

  // 1. Risk Level (dari Random Forest atau fallback kondisi kendala TANPA bobot subtask)
  let riskLevel: "HIGH" | "MEDIUM" | "LOW";
  if (aiPred?.risk_level) {
    riskLevel = aiPred.risk_level;
  } else {
    // Fallback: murni berdasarkan kondisi dan dampak waktu kendala, bukan bobot subtask progres
    if (kondisi === "BERHENTI" || delayMandor >= 7) {
      riskLevel = "HIGH";
    } else if (kondisi === "TERHAMBAT_SEBAGIAN" || delayMandor >= 3) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }
  }

  // 2. Estimasi Keterlambatan (dari HistGradientBoosting ClippedRegressor >= 0 atau fallback realistis)
  let delayEstimate: string;
  if (aiPred && typeof aiPred.delay_days === "number") {
    const roundedDays = Math.max(0, Math.round(aiPred.delay_days));
    delayEstimate = roundedDays <= 0 ? "< 1 hari" : `${roundedDays} hari`;
  } else {
    const minDelay = Math.max(
      1,
      delayMandor > 0 ? delayMandor : kondisi === "BERHENTI" ? 4 : 2,
    );
    const maxDelay =
      minDelay +
      (kondisi === "BERHENTI" ? 3 : kondisi === "TERHAMBAT_SEBAGIAN" ? 2 : 1);
    delayEstimate = `${minDelay}–${maxDelay} hari`;
  }

  // 3. Risiko Pembengkakan Biaya (Rule-Based murni, bukan Machine Learning)
  const { overbudget_risk: overbudgetRisk, cost_notes: costNotes } =
    analyzeCostRisk(kategori, deskripsi, kondisi, infoTambahan);

  // Ringkasan naratif Rule-Based
  const kondisiLabel =
    kondisi === "BERHENTI"
      ? "berhenti total"
      : kondisi === "TERHAMBAT_SEBAGIAN"
        ? "mengalami penurunan produktivitas"
        : "masih berjalan dengan penyesuaian";

  const summary =
    `Berdasarkan laporan mandor pada proyek ${designName}, kendala kategori "${kategori}" pada ${subtaskTitle} (${stageName}) menyebabkan aktivitas ${kondisiLabel}. ` +
    `Estimasi potensi dampak keterlambatan pekerjaan adalah ${delayEstimate}. ` +
    `Disarankan memprioritaskan pemulihan jalur kritis pekerjaan atau mengalihkan tenaga kerja ke subtask mandiri yang tidak bergantung pada area terdampak. ` +
    `Segala opsi yang menimbulkan selisih biaya atau perubahan spesifikasi wajib dikoordinasikan dan disetujui oleh Customer.`;

  // Checklist verifikasi untuk Pengawas
  const checklistFactors: string[] = [
    `Verifikasi fisik kondisi lapangan pada pekerjaan "${subtaskTitle}" apakah benar ${kondisiLabel}.`,
    `Periksa ketersediaan material cadangan dan konfirmasi jadwal komitmen pihak terkait/supplier.`,
    `Pastikan area kerja aman dari risiko cuaca dan kerusakan sebelum pengerjaan dilanjutkan.`,
    `Cek apakah ada subtask lain pada tahap ${stageName} yang dapat dikerjakan secara paralel tanpa menunggu kendala tuntas.`,
  ];

  // Rekomendasi 2-3 Opsi Solusi yang Spesifik Kategori
  const options = buildRecommendedOptions(
    kategori,
    subtaskTitle,
    delayEstimate,
  );

  return {
    risk_level: riskLevel,
    summary,
    metrics: {
      delay_estimate_days: delayEstimate,
      overbudget_risk: overbudgetRisk,
      cost_notes: costNotes,
    },
    checklist_factors: checklistFactors,
    recommended_options: options,
  };
}

function buildRecommendedOptions(
  kategori: string,
  subtaskTitle: string,
  delayEstimate: string,
) {
  switch (kategori) {
    case "MATERIAL_PERALATAN":
      return [
        {
          id: "OPTION_A",
          title: "Koordinasi supplier alternatif",
          is_primary: true,
          description: `Hubungi pemasok cadangan lokal untuk memenuhi material ${subtaskTitle} yang tertunda, sambil tetap melanjutkan pekerjaan lapangan pada subtask yang tidak terdampak.`,
          cost_impact: "Mungkin ada selisih harga material supplier cepat.",
          requires_approval: false,
        },
        {
          id: "OPTION_B",
          title: "Penyesuaian urutan tahapan kerja",
          is_primary: false,
          description: `Alihkan tenaga kerja sementara ke pekerjaan persiapan atau tahapan paralel lain yang siap, dan jadwalkan kembali ${subtaskTitle} setelah material tiba.`,
          cost_impact: "Tanpa biaya tambahan (relokasi tenaga kerja).",
          requires_approval: false,
        },
        {
          id: "OPTION_C",
          title: "Pengajuan spesifikasi alternatif setara",
          is_primary: false,
          description: `Ajukan merek atau spesifikasi material setara yang siap kirim hari ini. Perubahan spesifikasi/harga memerlukan persetujuan Customer sebelum pembelian.`,
          cost_impact: "Berpotensi ada penyesuaian biaya kontrak.",
          requires_approval: true,
        },
      ];

    case "CUACA_LINGKUNGAN":
      return [
        {
          id: "OPTION_A",
          title: "Pemasangan proteksi terpal & pengalihan ke area indoor",
          is_primary: true,
          description: `Pasang pelindung terpal/drainase darurat di area ${subtaskTitle} dan arahkan tukang ke pekerjaan interior atau persiapan material di bawah atap.`,
          cost_impact: "Biaya operasional terpal darurat minimal.",
          requires_approval: false,
        },
        {
          id: "OPTION_B",
          title: "Penyesuaian jam kerja (lembur cuaca cerah)",
          is_primary: false,
          description: `Gunakan waktu saat cuaca membaik dengan skema lembur terarah untuk mengejar ketertinggalan durasi ${delayEstimate}.`,
          cost_impact: "Mungkin ada insentif lembur tenaga kerja.",
          requires_approval: false,
        },
        {
          id: "OPTION_C",
          title: "Pengajuan adendum jadwal karena force majeure",
          is_primary: false,
          description: `Dokumentasikan cuaca ekstrem dan ajukan penyesuaian target tanggal selesai proyek kepada Customer tanpa biaya penalti.`,
          cost_impact: "Tanpa biaya, penyesuaian jadwal kontrak.",
          requires_approval: true,
        },
      ];

    case "TENAGA_KERJA":
      return [
        {
          id: "OPTION_A",
          title: "Penambahan tukang dari mitra mandor",
          is_primary: true,
          description: `Mandor menginstruksikan tambahan tenaga kerja harian terlatih untuk mengejar backlog pekerjaan ${subtaskTitle}.`,
          cost_impact: "Tercakup dalam komitmen mandor.",
          requires_approval: false,
        },
        {
          id: "OPTION_B",
          title: "Optimalisasi pembagian regu kerja",
          is_primary: false,
          description: `Fokuskan seluruh tukang yang hadir pada jalur kritis ${subtaskTitle} hingga tuntas sebelum membuka pekerjaan baru.`,
          cost_impact: "Tanpa biaya tambahan.",
          requires_approval: false,
        },
        {
          id: "OPTION_C",
          title: "Pemberian waktu kompensasi jadwal",
          is_primary: false,
          description: `Jika ada kendala kesehatan massal atau force majeure tenaga kerja, ajukan penyesuaian jadwal resmi ke Customer.`,
          cost_impact: "Tanpa biaya tambahan, adendum waktu.",
          requires_approval: true,
        },
      ];

    case "TEKNIS_KONSTRUKSI":
    case "DESAIN_SPESIFIKASI":
      return [
        {
          id: "OPTION_A",
          title: "Instruksi perbaikan metode kerja lapangan",
          is_primary: true,
          description: `Pengawas memberikan gambar detail revisi dan mengawasi langsung koreksi pekerjaan ${subtaskTitle} agar sesuai gambar kerja standar.`,
          cost_impact: "Beban perbaikan ditangani oleh pelaksana lapangan.",
          requires_approval: false,
        },
        {
          id: "OPTION_B",
          title: "Rapat koordinasi teknis bersama Customer",
          is_primary: false,
          description: `Klarifikasi detail gambar kerja atau perubahan arsitektur yang diminta Customer sebelum pekerjaan ${subtaskTitle} dilanjutkan.`,
          cost_impact: "Menunggu hasil kesepakatan spesifikasi.",
          requires_approval: true,
        },
        {
          id: "OPTION_C",
          title: "Variasi pekerjaan (Change Order)",
          is_primary: false,
          description: `Terbitkan usulan Change Order resmi mencakup rincian biaya baru dan tambahan hari kerja untuk disetujui Customer.`,
          cost_impact: "Perubahan nilai kontrak resmi.",
          requires_approval: true,
        },
      ];

    default:
      return [
        {
          id: "OPTION_A",
          title: "Penanganan operasional langsung oleh Pengawas",
          is_primary: true,
          description: `Pengawas mengoordinasikan langkah mitigasi langsung di lapangan bersama Mandor agar pekerjaan ${subtaskTitle} dapat kembali berjalan normal.`,
          cost_impact: "Dalam batas kewenangan pengawas.",
          requires_approval: false,
        },
        {
          id: "OPTION_B",
          title: "Penyesuaian urutan kerja",
          is_primary: false,
          description: `Atur ulang prioritas pekerjaan harian untuk meminimalkan dampak keterlambatan sekitar ${delayEstimate}.`,
          cost_impact: "Tanpa biaya tambahan.",
          requires_approval: false,
        },
        {
          id: "OPTION_C",
          title: "Eskalasi ke Customer untuk persetujuan solusi",
          is_primary: false,
          description: `Jika solusi membutuhkan perubahan biaya, desain, atau waktu penyelesaian, teruskan usulan kepada Customer untuk mendapatkan persetujuan tertulis.`,
          cost_impact: "Bergantung pada persetujuan Customer.",
          requires_approval: true,
        },
      ];
  }
}
