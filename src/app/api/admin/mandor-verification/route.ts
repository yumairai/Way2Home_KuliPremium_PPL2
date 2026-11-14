import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getMandorApplications } from "@/services/mandor-verification.service";
import { ServiceError } from "@/services/access.service";

export async function GET() {
  try {
    const applications = await getMandorApplications(await createClient());
    return NextResponse.json({ applications });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error("Error in GET /api/admin/mandor-verification:", error);
    return NextResponse.json(
      { message: "Gagal memuat antrean verifikasi mandor." },
      { status: 500 },
    );
  }
}
