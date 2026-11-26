import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireUser, ServiceError } from "@/services/access.service";
import { analyzeCostRisk, callAiKendalaService, type IssueAiAnalysisResult } from "@/services/ai-kendala.service";
import { isPengawasTestAccount } from "@/data/pengawas-test";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    const { data: profile, error } = await supabase.from("profiles").select("role, is_test_user").eq("id", user.id).single();
    if (error || profile?.role !== "pengawas" || profile.is_test_user !== true || !isPengawasTestAccount(user.email ?? "", true)) {
      throw new ServiceError("Akses hanya tersedia untuk akun testing pengawas.", 403);
    }
    const body = await request.json().catch(() => null) as {
      project?: { title?: string; design?: string; progress?: number };
      issue?: { description?: string; category?: string; affectedMilestone?: string; affectedSubtask?: string; workCondition?: string; estimatedDelayDays?: number; additionalInfo?: string };
    } | null;
    if (!body?.issue?.description || !body.issue.category) return NextResponse.json({ error: "Konteks kendala tidak lengkap." }, { status: 400 });
    const issue = body.issue;
    const category = issue.category!;
    const description = issue.description!;
    const condition = issue.workCondition ?? "TERHAMBAT_SEBAGIAN";
    const extra = issue.additionalInfo ?? "";
    const prediction = await callAiKendalaService({ kategori: category, deskripsi: description, kondisi_pekerjaan: condition, dampak_waktu_hari: issue.estimatedDelayDays ?? 0, informasi_tambahan: extra, progress_persen: body.project?.progress ?? 0 });
    const risk = prediction?.risk_level ?? (condition === "BERHENTI" ? "HIGH" : condition === "TERHAMBAT_SEBAGIAN" ? "MEDIUM" : "LOW");
    const delay = prediction ? `${Math.max(0, Math.round(prediction.delay_days))} hari` : `${Math.max(1, issue.estimatedDelayDays ?? 2)}–${Math.max(2, (issue.estimatedDelayDays ?? 2) + 2)} hari`;
    const cost = analyzeCostRisk(category, description, condition, extra);
    const milestone = issue.affectedMilestone ?? "tahap berjalan";
    const task = issue.affectedSubtask ?? "pekerjaan terdampak";
    const result: IssueAiAnalysisResult = {
      risk_level: risk,
      summary: `Pada proyek ${body.project?.design ?? body.project?.title ?? "pembangunan rumah"}, kendala pada ${task} (${milestone}) berpotensi menyebabkan keterlambatan ${delay}. Periksa kondisi lapangan dan atur ulang pekerjaan yang tidak terdampak.`,
      metrics: { delay_estimate_days: delay, overbudget_risk: cost.overbudget_risk, cost_notes: cost.cost_notes },
      checklist_factors: [`Verifikasi kondisi aktual pada ${task}.`, "Konfirmasi jadwal pemulihan material atau tenaga kerja.", "Tinjau subtask paralel yang dapat dikerjakan tanpa menunggu kendala."],
      recommended_options: [
        { id: "test-option-1", title: "Pulihkan jalur kerja", is_primary: true, description: "Koordinasikan pemasok alternatif dan lanjutkan pekerjaan pada area yang tidak terdampak.", cost_impact: "Tidak ada biaya tambahan yang dapat dipastikan.", requires_approval: false },
        { id: "test-option-2", title: "Atur ulang urutan pekerjaan", is_primary: false, description: "Pindahkan tenaga kerja ke subtask mandiri dan perbarui jadwal harian setelah kendala teratasi.", cost_impact: "Potensi penyesuaian waktu.", requires_approval: false },
        { id: "test-option-3", title: "Gunakan material setara", is_primary: false, description: "Ajukan material dengan spesifikasi setara setelah koordinasi perubahan dengan customer.", cost_impact: "Perlu pemeriksaan selisih biaya.", requires_approval: true },
      ],
    };
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ServiceError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analisis gagal." }, { status });
  }
}
