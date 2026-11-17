import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notifyProjectCompleted } from "@/services/notification.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verifikasi user login
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

    // Update status project menjadi 'selesai'
    const { error: pErr } = await adminClient
      .from("projects")
      .update({ status: "selesai" })
      .eq("id", projectId);

    if (pErr) {
      console.error("[project-complete] Gagal memperbarui status proyek:", pErr);
      return NextResponse.json(
        { message: "Gagal memperbarui status proyek.", error: pErr.message },
        { status: 500 },
      );
    }

    // Trigger notifikasi Event 9: Proyek Selesai 100% (fire-and-forget)
    notifyProjectCompleted(projectId).catch((err) => {
      console.error("[project-complete] Gagal mengirim notifikasi proyek selesai:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Proyek telah berhasil diselesaikan.",
    });
  } catch (error: unknown) {
    console.error("[project-complete] Unhandled error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal pada server." },
      { status: 500 },
    );
  }
}
