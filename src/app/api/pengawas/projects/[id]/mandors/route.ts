import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { assignMandorsToProject } from "@/services/allocation.service";
import { jsonError, readJson } from "@/services/http";

type Body = {
  mandor_ids?: string[];
};

/**
 * POST /api/pengawas/projects/[id]/mandors
 * Menugaskan satu atau lebih mandor terverifikasi ke proyek.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<Body>(request);
    const mandorIds = Array.isArray(body?.mandor_ids) ? body.mandor_ids : [];

    const supabase = await createClient();
    const result = await assignMandorsToProject(supabase, id, mandorIds);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/pengawas/projects/[id]/mandors",
      "Gagal menugaskan mandor ke proyek.",
    );
  }
}
