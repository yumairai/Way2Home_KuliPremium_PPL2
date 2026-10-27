import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyProgressReport } from "@/services/supervisor.service";
import { ServiceError } from "@/services/access.service";
import { jsonError, readJson } from "@/services/http";

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

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    return jsonError(
      error,
      "PATCH /api/pengawas/reports/[id]",
      "Gagal menyimpan keputusan verifikasi.",
    );
  }
}
