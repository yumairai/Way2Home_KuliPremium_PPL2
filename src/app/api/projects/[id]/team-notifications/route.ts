import { NextResponse } from "next/server";
import {
  notifyContractReady,
  notifyTeamAssigned,
} from "@/services/notification.service";
import { createClient } from "@/utils/supabase/server";

type NotificationEvent = "admin-assignment" | "staffing-finalized";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      event?: NotificationEvent;
    };

    if (
      body.event !== "admin-assignment" &&
      body.event !== "staffing-finalized"
    ) {
      return NextResponse.json(
        { message: "Jenis notifikasi tidak valid." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[team-notifications] profile lookup error:", profileError);
      return NextResponse.json(
        { message: "Gagal memverifikasi akun." },
        { status: 500 },
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("pengawas_id, status")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("[team-notifications] project lookup error:", projectError);
      return NextResponse.json(
        { message: "Gagal memverifikasi proyek." },
        { status: 500 },
      );
    }
    if (!project) {
      return NextResponse.json(
        { message: "Proyek tidak ditemukan." },
        { status: 404 },
      );
    }

    const canNotifyAssignment =
      body.event === "admin-assignment" &&
      profile?.role === "admin" &&
      project.status === "alokasi_mandor_pengawas" &&
      project.pengawas_id !== null;
    const canNotifyFinalization =
      body.event === "staffing-finalized" &&
      profile?.role === "pengawas" &&
      project.pengawas_id === user.id &&
      project.status === "finalisasi_kontrak";

    if (!canNotifyAssignment && !canNotifyFinalization) {
      return NextResponse.json(
        { message: "Anda tidak berwenang mengirim notifikasi proyek ini." },
        { status: 403 },
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "[team-notifications] SUPABASE_SERVICE_ROLE_KEY is not configured on the server.",
      );
      return NextResponse.json(
        {
          message:
            "Aksi berhasil, tetapi notifikasi customer tidak tersedia. Periksa konfigurasi SUPABASE_SERVICE_ROLE_KEY di server.",
        },
        { status: 503 },
      );
    }

    if (canNotifyFinalization) {
      await Promise.all([
        notifyTeamAssigned(projectId),
        notifyContractReady(projectId),
      ]);
    } else {
      await notifyTeamAssigned(projectId);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[POST /api/projects/[id]/team-notifications]", error);
    return NextResponse.json(
      { message: "Gagal mengirim notifikasi proyek." },
      { status: 500 },
    );
  }
}
