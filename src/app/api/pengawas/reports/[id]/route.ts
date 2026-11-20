import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyProgressReport } from "@/services/supervisor.service";
import { ServiceError } from "@/services/access.service";
import { jsonError, readJson } from "@/services/http";
import { getProjectProgress } from "@/services/progress.service";
import {
  notifyProgressApproved,
  notifyProjectCompleted,
} from "@/services/notification.service";

/**
 * PATCH /api/pengawas/reports/[id]
 *
 * Verifikasi laporan progress mandor.
 *   { "decision": "Disetujui" }    -> subtask selesai, progres tahap & resmi naik
 *   { "decision": "Perlu revisi", "feedback": "..." } -> subtask tetap terbuka
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<{ decision?: string; feedback?: string }>(
      request,
    );
    const decision = String(body?.decision ?? "");

    if (decision !== "Disetujui" && decision !== "Perlu revisi") {
      throw new ServiceError(
        'Keputusan harus "Disetujui" atau "Perlu revisi".',
        422,
      );
    }

    const supabase = await createClient();
    await verifyProgressReport(
      supabase,
      id,
      decision,
      String(body?.feedback ?? ""),
    );

    // Fire-and-forget: kirim notifikasi persetujuan progres / proyek selesai
    if (decision === "Disetujui") {
      void (async () => {
        try {
          const { data: reportData } = await supabase
            .from("progress_reports")
            .select(
              "keterangan, foto_url, project_stages(project_id), project_subtasks(judul)",
            )
            .eq("id", id)
            .maybeSingle();

          const stageRow = reportData?.project_stages as
            | Record<string, unknown>
            | null
            | undefined;
          const subtaskRow = reportData?.project_subtasks as
            | Record<string, unknown>
            | null
            | undefined;
          const projectId = String(stageRow?.project_id ?? "");
          if (!projectId) return;

          const subtaskTitle = String(
            subtaskRow?.judul ?? reportData?.keterangan ?? "Pekerjaan Proyek",
          );
          const photoUrl = (reportData?.foto_url as string | null) ?? null;

          const { data: proj } = await supabase
            .from("projects")
            .select("status")
            .eq("id", projectId)
            .maybeSingle();

          const isCompleted = String(proj?.status ?? "") === "selesai";
          if (isCompleted) {
            await notifyProjectCompleted(projectId);
          } else {
            const { overallProgress } = await getProjectProgress(
              supabase,
              projectId,
            );
            await notifyProgressApproved(
              projectId,
              subtaskTitle,
              overallProgress ?? 0,
              photoUrl,
            );
          }
        } catch (err: unknown) {
          console.error("[reports/PATCH] notification error:", err);
        }
      })();
    }

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    return jsonError(
      error,
      "PATCH /api/pengawas/reports/[id]",
      "Gagal menyimpan keputusan verifikasi.",
    );
  }
}
