import { NextResponse } from "next/server";
import { requireRole, ServiceError } from "@/services/access.service";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    await requireRole(supabase, "customer");

    const { error } = await supabase.rpc("sign_project_contract", {
      pid: projectId,
    });

    if (error) {
      if (error.code === "P0002") {
        throw new ServiceError("Proyek tidak ditemukan.", 404);
      }
      if (error.code === "P0001") {
        throw new ServiceError(error.message, 409);
      }
      if (error.code === "42501") {
        throw new ServiceError("Akses ditolak.", 403);
      }

      console.error("[Contract] Failed to sign project contract:", error);
      throw new ServiceError("Gagal memfinalisasi kontrak.", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("Error in POST /api/projects/[id]/sign-contract:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memfinalisasi kontrak." },
      { status: 500 },
    );
  }
}
