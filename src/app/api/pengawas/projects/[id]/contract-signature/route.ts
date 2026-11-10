import { NextResponse } from "next/server";
import { requireRole, ServiceError } from "@/services/access.service";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { user } = await requireRole(supabase, "pengawas");
    const body = (await request.json()) as { signature?: unknown };
    if (typeof body.signature !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.signature)) throw new ServiceError("Tanda tangan PNG tidak valid.", 400);
    const bytes = Buffer.from(body.signature.slice("data:image/png;base64,".length), "base64");
    if (!bytes.length || bytes.length > 1024 * 1024 || bytes.toString("base64") !== body.signature.slice("data:image/png;base64,".length)) throw new ServiceError("Ukuran atau format tanda tangan tidak valid.", 400);
    const path = `${projectId}/${user.id}/pengawas-${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage.from("contract-signatures").upload(path, bytes, { contentType: "image/png", upsert: false });
    if (uploadError) throw new ServiceError("Tanda tangan gagal diunggah. Coba lagi.", 500);
    const { error } = await supabase.rpc("sign_supervisor_contract", { pid: projectId, signature_path: path });
    if (error) {
      await supabase.storage.from("contract-signatures").remove([path]);
      if (error.code === "P0002") throw new ServiceError("Proyek tidak ditemukan.", 404);
      if (error.code === "P0001") throw new ServiceError(error.message, 409);
      if (error.code === "42501") throw new ServiceError("Akses ditolak.", 403);
      throw new ServiceError("Gagal menyimpan tanda tangan pengawas.", 500);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ServiceError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("[Contract] Supervisor signature failed:", error);
    return NextResponse.json({ message: "Gagal menyimpan tanda tangan." }, { status: 500 });
  }
}
