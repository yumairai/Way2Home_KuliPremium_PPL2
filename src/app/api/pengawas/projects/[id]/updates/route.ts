import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { addProjectUpdate } from "@/services/supervisor.service";
import { jsonError, readJson } from "@/services/http";

/**
 * POST /api/pengawas/projects/[id]/updates
 * Terbitkan update proyek yang hanya diperuntukkan bagi customer.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<{ judul?: string; isi?: string }>(request);
    const supabase = await createClient();

    const update = await addProjectUpdate(
      supabase,
      id,
      String(body?.judul ?? ""),
      String(body?.isi ?? ""),
    );

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/pengawas/projects/[id]/updates",
      "Gagal menerbitkan update proyek.",
    );
  }
}
