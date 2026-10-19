import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deleteCancellableProject } from "@/services/project.service";
import { ServiceError } from "@/services/access.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await deleteCancellableProject(supabase, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("Error in DELETE /api/projects/[id]:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menghapus proyek." },
      { status: 500 }
    );
  }
}