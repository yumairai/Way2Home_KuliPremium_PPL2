import { NextResponse } from "next/server";
import { requireRole, ServiceError } from "@/services/access.service";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await requireRole(supabase, "customer");
    throw new ServiceError(
      "Gunakan tanda tangan digital dan persetujuan pada halaman kontrak.",
      400,
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("[Contract] Legacy sign endpoint:", error);
    return NextResponse.json({ message: "Gagal memproses persetujuan kontrak." }, { status: 500 });
  }
}
