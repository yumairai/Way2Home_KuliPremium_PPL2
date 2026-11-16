import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  notifyProgressApproved,
  notifyProjectCompleted,
} from "@/services/notification.service";

type ApproveRequestBody = {
  reportId?: string;
  subtaskTitle?: string;
  progressPercentage?: number;
  photoUrl?: string | null;
  isCompleted?: boolean;
};

export async function POST(
  request: Request,
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

    const body: ApproveRequestBody = await request.json().catch(() => ({}));
    const subtaskTitle = body.subtaskTitle || "Pekerjaan Konstruksi";
    const progressPercentage = Number(body.progressPercentage) || 0;
    const photoUrl = body.photoUrl || null;
    const isCompleted = Boolean(body.isCompleted || progressPercentage >= 100);

    // Update status progress_report di database jika reportId valid
    if (body.reportId) {
      await adminClient
        .from("progress_reports")
        .update({
          keputusan: "disetujui",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", body.reportId);
    }

    // Event 8: Trigger notifikasi progres disetujui
    notifyProgressApproved(
      projectId,
      subtaskTitle,
      progressPercentage,
      photoUrl,
    ).catch((err) => {
      console.error("[approve-progress] Gagal mengirim notifikasi progres:", err);
    });

    // Event 9: Jika progress telah mencapai 100% atau isCompleted, trigger notifikasi proyek selesai
    if (isCompleted) {
      await adminClient
        .from("projects")
        .update({ status: "selesai" })
        .eq("id", projectId);

      notifyProjectCompleted(projectId).catch((err) => {
        console.error("[approve-progress] Gagal mengirim notifikasi proyek selesai:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Progres proyek berhasil diverifikasi dan disetujui.",
      progressPercentage,
      isCompleted,
    });
  } catch (error: unknown) {
    console.error("[approve-progress] Unhandled error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal pada server." },
      { status: 500 },
    );
  }
}
