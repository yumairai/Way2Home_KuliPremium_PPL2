import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getVerifiedMandors } from "@/services/allocation.service";
import { jsonError } from "@/services/http";

/**
 * GET /api/pengawas/mandors
 * Mengambil daftar mandor yang sudah terverifikasi admin dan siap ditugaskan.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const mandors = await getVerifiedMandors(supabase);
    return NextResponse.json(mandors);
  } catch (error) {
    return jsonError(
      error,
      "GET /api/pengawas/mandors",
      "Gagal memuat daftar mandor terverifikasi.",
    );
  }
}

