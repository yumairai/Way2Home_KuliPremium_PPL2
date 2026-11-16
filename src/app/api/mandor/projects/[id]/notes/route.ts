import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { submitForemanNote } from "@/services/mandor.service";
import { jsonError, readJson } from "@/services/http";

/** POST /api/mandor/projects/[id]/notes — catatan singkat mandor untuk pengawas. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<{ catatan?: string }>(request);
    const supabase = await createClient();
    const note = await submitForemanNote(
      supabase,
      id,
      String(body?.catatan ?? ""),
    );

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/mandor/projects/[id]/notes",
      "Gagal mengirim catatan.",
    );
  }
}
