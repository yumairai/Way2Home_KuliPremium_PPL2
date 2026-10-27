import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSupervisorProject } from "@/services/supervisor.service";
import { jsonError } from "@/services/http";

/**
 * GET /api/pengawas/projects/[id]
 * Detail proyek yang diawasi: tahapan, subtask, laporan progress,
 * kendala beserta penanganannya, catatan mandor, dokumentasi,
 * update customer, dan monitoring pembayaran.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const project = await getSupervisorProject(supabase, id);

    if (!project) {
      return NextResponse.json(
        { message: "Proyek tidak ditemukan atau bukan penugasan Anda." },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    return jsonError(
      error,
      "GET /api/pengawas/projects/[id]",
      "Gagal memuat detail proyek.",
    );
  }
}
