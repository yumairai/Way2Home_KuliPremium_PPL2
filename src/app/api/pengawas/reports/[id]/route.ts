import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyProgressReport } from "@/services/supervisor.service";
import { ServiceError } from "@/services/access.service";
import { jsonError, readJson } from "@/services/http";
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
      // Ambil project_id dari report
      supabase
        .from("progress_reports")
        .select("project_stage_id, project_stages(project_id)")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => {
          const stageRow = data?.project_stages as
            | Record<string, unknown>
            | null
            | undefined;
          const projectId = String(stageRow?.project_id ?? "");
          if (!projectId) return;

          // Ambil progress terbaru
          supabase
            .from("projects")
            .select("status")
            .eq("id", projectId)
            .maybeSingle()
            .then(({ data: proj }) => {
              const isCompleted = String(proj?.status ?? "") === "selesai";
              if (isCompleted) {
                notifyProjectCompleted(projectId).catch((err) =>
                  console.error("[reports/PATCH] notifyProjectCompleted:", err),
                );
              } else {
                notifyProgressApproved(projectId, decision).catch((err) =>
                  console.error("[reports/PATCH] notifyProgressApproved:", err),
                );
              }
            })
            .catch((err) =>
              console.error("[reports/PATCH] fetch project status:", err),
            );
        })
        .catch((err) =>
          console.error("[reports/PATCH] fetch report project_id:", err),
        );
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
