import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getMandorRegistration,
  resubmitMandorApplication,
} from "@/services/mandor.service";
import { jsonError } from "@/services/http";

/** GET /api/mandor/registration — status verifikasi pendaftaran mandor. */
export async function GET() {
  try {
    const supabase = await createClient();
    return NextResponse.json(await getMandorRegistration(supabase));
  } catch (error) {
    return jsonError(
      error,
      "GET /api/mandor/registration",
      "Gagal memuat status pendaftaran.",
    );
  }
}

/**
 * POST /api/mandor/registration
 * Ajukan ulang pendaftaran setelah ditolak: status kembali 'pending'
 * dan catatan penolakan dihapus. Pemicu di database mencegah mandor
 * menyetujui dirinya sendiri.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const status = await resubmitMandorApplication(supabase);
    return NextResponse.json({ status });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/mandor/registration",
      "Gagal mengajukan ulang pendaftaran.",
    );
  }
}

