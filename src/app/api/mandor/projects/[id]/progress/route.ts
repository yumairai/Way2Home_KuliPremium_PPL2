import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { submitProgressReport } from "@/services/mandor.service";
import { jsonError, readJson } from "@/services/http";

/**
 * POST /api/mandor/projects/[id]/progress
 * Kirim laporan progress satu subtask. Selalu berstatus 'menunggu'
 * sehingga progres resmi baru berubah setelah diverifikasi Pengawas.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<{
      project_subtask_id?: string;
      keterangan?: string;
      foto_url?: string | null;
    }>(request);

    const supabase = await createClient();
    const report = await submitProgressReport(supabase, id, {
      project_subtask_id: String(body?.project_subtask_id ?? ""),
      keterangan: String(body?.keterangan ?? ""),
      foto_url: body?.foto_url ?? null,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/mandor/projects/[id]/progress",
      "Gagal mengirim laporan progress.",
    );
  }
}
