import { NextResponse } from "next/server";
import { requireRole, ServiceError } from "@/services/access.service";
import { createClient } from "@/utils/supabase/server";
import { notifyDpReady } from "@/services/notification.service";
import { seedProjectSubtasks } from "@/services/subtask-seeding.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { user } = await requireRole(supabase, "customer");
    const body = (await request.json()) as {
      signature?: unknown;
      consent?: unknown;
    };
    if (body.consent !== true)
      throw new ServiceError(
        "Konfirmasi membaca dan menyetujui kontrak wajib dilakukan.",
        400,
      );
    if (
      typeof body.signature !== "string" ||
      !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.signature)
    )
      throw new ServiceError("Tanda tangan PNG tidak valid.", 400);
    const bytes = Buffer.from(
      body.signature.slice("data:image/png;base64,".length),
      "base64",
    );
    if (
      !bytes.length ||
      bytes.length > 1024 * 1024 ||
      bytes.toString("base64") !==
        body.signature.slice("data:image/png;base64,".length)
    )
      throw new ServiceError(
        "Ukuran atau format tanda tangan tidak valid.",
        400,
      );
    const path = `${projectId}/${user.id}/customer-${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("contract-signatures")
      .upload(path, bytes, { contentType: "image/png", upsert: false });
    if (uploadError)
      throw new ServiceError("Tanda tangan gagal diunggah. Coba lagi.", 500);
    // Siapkan milestone dan subtask sebelum RPC mengaktifkan kontrak.
    try {
      await seedProjectSubtasks(projectId, supabase);
    } catch (seedError) {
      console.warn("[contract-signature] seed stages warning:", seedError);
    }

    const { error } = await supabase.rpc("sign_project_contract", {
      pid: projectId,
      signature_path: path,
    });
    if (error) {
      await supabase.storage.from("contract-signatures").remove([path]);
      if (error.code === "P0002")
        throw new ServiceError("Proyek tidak ditemukan.", 404);
      if (error.code === "P0001") throw new ServiceError(error.message, 409);
      if (error.code === "42501") throw new ServiceError("Akses ditolak.", 403);
      throw new ServiceError("Gagal menyimpan persetujuan kontrak.", 500);
    }

    // Fire-and-forget: notifikasi Event 5 — DP Siap Dibayar
    void (async () => {
      try {
        const { data: dpStage } = await supabase
          .from("payment_stages")
          .select("nominal")
          .eq("project_id", projectId)
          .eq("urutan", 0)
          .maybeSingle();

        const dpAmount = dpStage?.nominal ? Number(dpStage.nominal) : undefined;
        await notifyDpReady(projectId, dpAmount);
      } catch (err: unknown) {
        console.error("[contract-signature] notifyDpReady:", err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ServiceError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    console.error("[Contract] Customer signature failed:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan tanda tangan." },
      { status: 500 },
    );
  }
}
