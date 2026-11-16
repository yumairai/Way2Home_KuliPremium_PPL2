import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notifyDpReady } from "@/services/notification.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Pastikan user sedang login
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "Anda harus login terlebih dahulu." },
        { status: 401 },
      );
    }

    // Update status proyek menjadi 'pembayaran_dp'
    const { data: project, error: pErr } = await adminClient
      .from("projects")
      .update({ status: "pembayaran_dp" })
      .eq("id", projectId)
      .select("id, status")
      .maybeSingle();

    if (pErr) {
      console.error("[sign-contract] Gagal memperbarui status proyek:", pErr);
      return NextResponse.json(
        { message: "Gagal memperbarui status proyek.", error: pErr.message },
        { status: 500 },
      );
    }

    // Update status kontrak jika ada
    await adminClient
      .from("contracts")
      .update({
        status: "aktif",
        signed_customer_at: new Date().toISOString(),
      })
      .eq("project_id", projectId);

    // Ambil nominal DP dari payment stages (urutan 0) jika ada
    let dpAmount: number | undefined;
    const { data: dpStage } = await adminClient
      .from("payment_stages")
      .select("nominal")
      .eq("project_id", projectId)
      .eq("urutan", 0)
      .maybeSingle();

    if (dpStage?.nominal) {
      dpAmount = Number(dpStage.nominal);
    }

    // Trigger notifikasi Event 5: DP Siap Dibayar (fire-and-forget)
    notifyDpReady(projectId, dpAmount).catch((err) => {
      console.error("[sign-contract] Gagal mengirim notifikasi DP:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Kontrak berhasil ditandatangani dan status proyek beralih ke pembayaran DP.",
      project,
    });
  } catch (error: unknown) {
    console.error("[sign-contract] Unhandled error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal pada server." },
      { status: 500 },
    );
  }
}
