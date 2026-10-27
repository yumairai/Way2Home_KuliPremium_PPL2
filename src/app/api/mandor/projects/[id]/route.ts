import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getMandorProject } from "@/services/mandor.service";
import { jsonError } from "@/services/http";

/** GET /api/mandor/projects/[id] — detail proyek + tahapan, laporan, kendala. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const project = await getMandorProject(supabase, id);

    if (!project) {
      return NextResponse.json(
        { message: "Proyek tidak ditemukan atau bukan milik Anda." },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    return jsonError(
      error,
      "GET /api/mandor/projects/[id]",
      "Gagal memuat detail proyek.",
    );
  }
}
