import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDocumentVerificationRequests } from "@/services/admin-verification.service";
import { ServiceError } from "@/services/access.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const requests = await getDocumentVerificationRequests(supabase);
    return NextResponse.json({ requests });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Error in GET /api/admin/document-verification:", error);
    return NextResponse.json(
      { message: "Gagal memuat pengajuan verifikasi dokumen." },
      { status: 500 },
    );
  }
}