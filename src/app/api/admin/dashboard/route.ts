import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAdminDashboardData } from "@/services/admin-dashboard.service";
import { ServiceError } from "@/services/access.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const data = await getAdminDashboardData(supabase);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[GET /api/admin/dashboard] error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data dashboard admin." },
      { status: 500 },
    );
  }
}
