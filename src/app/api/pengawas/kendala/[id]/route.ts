import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { followUpKendala } from "@/services/supervisor.service";
import { jsonError, readJson } from "@/services/http";

/**
 * PATCH /api/pengawas/kendala/[id]
 * Catat tindak lanjut pengawas. Status kendala menjadi 'reviewed'
 * ("Ditindaklanjuti") dan instruksi diteruskan ke mandor.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<{ tindak_lanjut?: string }>(request);
    const supabase = await createClient();

    await followUpKendala(supabase, id, String(body?.tindak_lanjut ?? ""));

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error,
      "PATCH /api/pengawas/kendala/[id]",
      "Gagal menyimpan tindak lanjut kendala.",
    );
  }
}
