import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getMandorProjects } from "@/services/mandor.service";
import { jsonError } from "@/services/http";

/** GET /api/mandor/projects — daftar proyek milik mandor yang login. */
export async function GET() {
  try {
    const supabase = await createClient();
    return NextResponse.json(await getMandorProjects(supabase));
  } catch (error) {
    return jsonError(
      error,
      "GET /api/mandor/projects",
      "Gagal memuat daftar proyek Anda.",
    );
  }
}
