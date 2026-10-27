import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { addProjectDocumentation } from "@/services/supervisor.service";
import { jsonError, readJson } from "@/services/http";

/**
 * POST /api/pengawas/projects/[id]/documentation
 * Unggah dokumentasi lapangan milik proyek (foto dikirim sebagai data-URL).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<{
      url?: string;
      catatan?: string;
      project_stage_id?: string | null;
    }>(request);

    const supabase = await createClient();
    const item = await addProjectDocumentation(
      supabase,
      id,
      String(body?.url ?? ""),
      String(body?.catatan ?? ""),
      body?.project_stage_id ?? null,
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/pengawas/projects/[id]/documentation",
      "Gagal menyimpan dokumentasi.",
    );
  }
}
