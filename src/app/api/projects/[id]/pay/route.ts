import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireRole, ServiceError } from "@/services/access.service";
import type { Database } from "@/types/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /api/projects/[id]/pay
 *
 * Body: { payment_stage_id: string }
 *
 * Creates a Midtrans Snap transaction token for the next unpaid payment stage.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ServiceError("Format permintaan tidak valid.", 400);
    }

    const paymentStageId =
      typeof body === "object" && body !== null && "payment_stage_id" in body
        ? body.payment_stage_id
        : undefined;
    if (
      typeof paymentStageId !== "string" ||
      !UUID_PATTERN.test(paymentStageId)
    ) {
      throw new ServiceError("Tahap pembayaran tidak valid.", 400);
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new ServiceError(
        "Konfigurasi payment gateway belum lengkap.",
        500,
      );
    }

    const supabase = await createClient();
    const { user } = await requireRole(supabase, "customer");

    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", projectId)
      .eq("customer_id", user.id)
      .single();

    if (projectErr || !project) {
      throw new ServiceError("Proyek tidak ditemukan.", 404);
    }

    const allowedStatuses: Database["public"]["Enums"]["project_status"][] = [
      "pembayaran_dp",
      "berjalan",
    ];
    if (!allowedStatuses.includes(project.status)) {
      throw new ServiceError(
        "Pembayaran tidak tersedia pada tahap ini.",
        409,
      );
    }

    const { data: stages, error: stagesErr } = await supabase
      .from("payment_stages")
      .select("id, nama_tahap, urutan, nominal, status")
      .eq("project_id", projectId)
      .order("urutan", { ascending: true });

    if (stagesErr) {
      console.error("[Midtrans] Failed to load payment stages:", stagesErr);
      throw new ServiceError("Gagal memuat tahapan pembayaran.", 500);
    }
    if (!stages?.length) {
      throw new ServiceError("Tahap pembayaran belum tersedia.", 404);
    }

    const targetStage = stages.find((stage) => stage.id === paymentStageId);
    if (!targetStage) {
      throw new ServiceError("Tahap pembayaran tidak valid.", 404);
    }
    if (targetStage.status === "lunas") {
      throw new ServiceError("Tahap pembayaran ini sudah lunas.", 409);
    }
    if (!Number.isSafeInteger(targetStage.nominal) || targetStage.nominal <= 0) {
      throw new ServiceError("Nominal pembayaran tidak valid.", 409);
    }

    const nextUnpaidStage = stages.find((stage) => stage.status !== "lunas");
    if (!nextUnpaidStage || nextUnpaidStage.id !== targetStage.id) {
      throw new ServiceError(
        "Tahap pembayaran sebelumnya harus lunas terlebih dahulu.",
        409,
      );
    }
    if (
      (project.status === "pembayaran_dp" && targetStage.urutan !== 0) ||
      (project.status === "berjalan" && targetStage.urutan === 0)
    ) {
      throw new ServiceError(
        "Tahap pembayaran tidak sesuai dengan status proyek.",
        409,
      );
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) {
      console.error("[Midtrans] Failed to load customer profile:", profileErr);
      throw new ServiceError("Gagal memuat data pelanggan.", 500);
    }

    // Embed the stage UUID so the notification can resolve the exact stage
    // without relying on a potentially ambiguous project-id prefix.
    const orderId = `W2H-${targetStage.id}-${Date.now().toString(36)}`;
    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: targetStage.nominal,
      },
      item_details: [
        {
          id: targetStage.id,
          price: targetStage.nominal,
          quantity: 1,
          name: targetStage.nama_tahap.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: profile?.full_name || "Customer",
        email: user.email || "",
        phone: profile?.phone || "",
      },
    };

    const snapResponse = await fetch(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        },
        body: JSON.stringify(midtransPayload),
      },
    );

    let snapData: {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };
    try {
      snapData = await snapResponse.json();
    } catch {
      console.error("[Midtrans] Snap returned a non-JSON response.");
      throw new ServiceError(
        "Gagal membuat transaksi pembayaran. Coba lagi.",
        502,
      );
    }

    if (!snapResponse.ok || !snapData.token) {
      console.error("[Midtrans] Snap token error:", snapData);
      throw new ServiceError(
        "Gagal membuat transaksi pembayaran. Coba lagi.",
        502,
      );
    }

    return NextResponse.json({
      token: snapData.token,
      redirect_url: snapData.redirect_url,
      order_id: orderId,
    });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("Error in POST /api/projects/[id]/pay:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memproses pembayaran." },
      { status: 500 },
    );
  }
}
