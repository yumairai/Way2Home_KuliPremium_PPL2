import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { seedProgressAfterPayment } from "@/services/progress-seeding.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    let paymentStageId: string | undefined;
    try {
      const body = await request.json() as { payment_stage_id?: unknown };
      paymentStageId =
        typeof body.payment_stage_id === "string"
          ? body.payment_stage_id
          : undefined;
    } catch {
      paymentStageId = undefined;
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Sesi tidak valid." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_test_user, role")
      .eq("id", user.id)
      .single();
    if (profileError || !profile?.is_test_user || profile.role !== "customer") {
      return NextResponse.json(
        { message: "Endpoint hanya untuk akun test customer." },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, customer_id, status")
      .eq("id", projectId)
      .eq("customer_id", user.id)
      .single();
    if (projectError || !project) {
      return NextResponse.json(
        { message: "Proyek tidak ditemukan atau bukan milik Anda." },
        { status: 404 },
      );
    }

    const { data: paymentStages, error: stagesError } = await admin
      .from("payment_stages")
      .select("id, nama_tahap, nominal, status, urutan")
      .eq("project_id", projectId)
      .order("urutan", { ascending: true });
    if (stagesError || !paymentStages?.length) {
      return NextResponse.json(
        { message: "Tahap pembayaran belum tersedia." },
        { status: 400 },
      );
    }

    const targetStage = paymentStageId
      ? paymentStages.find((stage) => stage.id === paymentStageId)
      : paymentStages.find((stage) => stage.status === "belum");
    if (!targetStage) {
      return NextResponse.json(
        { message: "Tahap pembayaran tidak ditemukan." },
        { status: 400 },
      );
    }

    if (targetStage.urutan === 0) {
      if (project.status !== "pembayaran_dp") {
        return NextResponse.json(
          {
            message: `Status proyek ${project.status} tidak mendukung pembayaran DP test.`,
          },
          { status: 400 },
        );
      }
    } else if (project.status !== "berjalan") {
      return NextResponse.json(
        {
          message: `Status proyek ${project.status} tidak mendukung pembayaran cicilan test.`,
        },
        { status: 400 },
      );
    }

    const previousUnpaid = paymentStages.find(
      (stage) =>
        stage.urutan < targetStage.urutan && stage.status !== "lunas",
    );
    if (previousUnpaid) {
      return NextResponse.json(
        { message: "Tahap pembayaran sebelumnya belum lunas." },
        { status: 400 },
      );
    }

    if (targetStage.status === "lunas") {
      const progressByStage: Record<number, 30 | 55 | 80 | 100> = {
        0: 30,
        1: 55,
        2: 80,
        3: 100,
      };
      let progressSeeded = false;
      try {
        await seedProgressAfterPayment(
          projectId,
          progressByStage[targetStage.urutan] ?? 30,
        );
        progressSeeded = true;
      } catch (seedError) {
        console.error("[test-payment] Progress seeding retry failed:", seedError);
      }
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        message: `${targetStage.nama_tahap} sudah lunas.`,
        projectId,
        amountPaid: targetStage.nominal,
        progressSeeded,
      });
    }

    const { error: updateError } = await admin
      .from("payment_stages")
      .update({
        status: "lunas",
        tanggal_bayar: new Date().toISOString(),
      })
      .eq("id", targetStage.id)
      .eq("project_id", projectId)
      .eq("status", "belum");
    if (updateError) {
      console.error("[test-payment] Payment update failed:", updateError);
      return NextResponse.json(
        { message: "Gagal memproses pembayaran test." },
        { status: 500 },
      );
    }

    if (targetStage.urutan === 0) {
      const { error: activateError } = await admin
        .from("projects")
        .update({ status: "berjalan" })
        .eq("id", projectId)
        .eq("customer_id", user.id)
        .eq("status", "pembayaran_dp");
      if (activateError) {
        await admin
          .from("payment_stages")
          .update({ status: "belum", tanggal_bayar: null })
          .eq("id", targetStage.id);
        return NextResponse.json(
          { message: "Gagal mengaktifkan proyek setelah pembayaran DP." },
          { status: 500 },
        );
      }
    } else if (targetStage.urutan === 3) {
      await admin
        .from("projects")
        .update({ status: "selesai" })
        .eq("id", projectId)
        .eq("customer_id", user.id);
    }

    const progressByStage: Record<number, 30 | 55 | 80 | 100> = {
      0: 30,
      1: 55,
      2: 80,
      3: 100,
    };
    let progressSeeded = false;
    try {
      await seedProgressAfterPayment(
        projectId,
        progressByStage[targetStage.urutan] ?? 30,
      );
      progressSeeded = true;
    } catch (seedError) {
      console.error("[test-payment] Progress seeding failed:", seedError);
      return NextResponse.json(
        {
          message: "Pembayaran berhasil disetujui.",
          projectId,
          progressSeeded: false,
          seedingWarning:
            "Progress sedang disiapkan. Ulangi sekali untuk memperbaiki progress.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${targetStage.nama_tahap} berhasil disetujui.`,
      projectId,
      amountPaid: targetStage.nominal,
      progressSeeded,
    });
  } catch (error) {
    console.error("[test-payment] Error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 },
    );
  }
}
