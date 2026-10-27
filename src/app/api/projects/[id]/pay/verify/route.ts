import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { requireRole, ServiceError } from "@/services/access.service";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database.types";

const ORDER_ID_PATTERN =
  /^W2H-([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-([0-9a-z]+)$/i;

type MidtransStatusResponse = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  transaction_status?: string;
  fraud_status?: string;
};

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

    const orderId =
      typeof body === "object" && body !== null && "order_id" in body
        ? body.order_id
        : undefined;
    if (typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId)) {
      throw new ServiceError("ID transaksi tidak valid.", 400);
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serverKey || !supabaseUrl || !serviceRoleKey) {
      console.error("[Midtrans Verify] Missing required server configuration.");
      throw new ServiceError("Konfigurasi pembayaran belum lengkap.", 500);
    }

    const supabase = await createClient();
    const { user } = await requireRole(supabase, "customer");

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", projectId)
      .eq("customer_id", user.id)
      .maybeSingle();
    if (projectError) {
      console.error("[Midtrans Verify] Project lookup failed:", projectError);
      throw new ServiceError("Gagal memeriksa proyek.", 500);
    }
    if (!project) {
      throw new ServiceError("Proyek tidak ditemukan.", 404);
    }

    if (project.status !== "pembayaran_dp" && project.status !== "berjalan") {
      throw new ServiceError(
        "Pembayaran tidak tersedia pada tahap ini.",
        409,
      );
    }

    const orderMatch = ORDER_ID_PATTERN.exec(orderId);
    const paymentStageId = orderMatch?.[1];
    if (!paymentStageId) {
      throw new ServiceError("ID transaksi tidak valid.", 400);
    }

    const { data: paymentStage, error: stageError } = await supabase
      .from("payment_stages")
      .select("id, project_id, urutan, nominal, status")
      .eq("id", paymentStageId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (stageError) {
      console.error("[Midtrans Verify] Payment stage lookup failed:", stageError);
      throw new ServiceError("Gagal memeriksa tahap pembayaran.", 500);
    }
    if (!paymentStage) {
      throw new ServiceError("Tahap pembayaran tidak ditemukan.", 404);
    }
    if (paymentStage.status === "lunas") {
      return NextResponse.json({ paid: true, transaction_status: "settlement" });
    }

    const statusResponse = await fetch(
      `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        },
        cache: "no-store",
      },
    );

    let transaction: MidtransStatusResponse;
    try {
      transaction = await statusResponse.json();
    } catch {
      console.error("[Midtrans Verify] Status API returned a non-JSON response.");
      throw new ServiceError("Gagal memeriksa status transaksi.", 502);
    }
    if (statusResponse.status === 404) {
      return NextResponse.json({
        paid: false,
        transaction_status: "pending",
      });
    }
    if (!statusResponse.ok) {
      console.error("[Midtrans Verify] Status API error:", transaction);
      throw new ServiceError("Gagal memeriksa status transaksi.", 502);
    }

    if (
      transaction.order_id !== orderId ||
      !Number.isFinite(Number(transaction.gross_amount)) ||
      Number(transaction.gross_amount) !== Number(paymentStage.nominal)
    ) {
      console.error("[Midtrans Verify] Transaction details mismatch:", orderId);
      throw new ServiceError("Data transaksi tidak sesuai.", 409);
    }

    const isPaid =
      transaction.transaction_status === "settlement" ||
      (transaction.transaction_status === "capture" &&
        transaction.fraud_status === "accept");
    if (!isPaid) {
      return NextResponse.json({
        paid: false,
        transaction_status: transaction.transaction_status,
      });
    }

    const adminSupabase = createSupabaseAdminClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { error: updateStageError } = await adminSupabase
      .from("payment_stages")
      .update({
        status: "lunas",
        tanggal_bayar: new Date().toISOString(),
      })
      .eq("id", paymentStage.id)
      .neq("status", "lunas");
    if (updateStageError) {
      console.error("[Midtrans Verify] Payment update failed:", updateStageError);
      throw new ServiceError("Gagal memperbarui status pembayaran.", 500);
    }

    if (paymentStage.urutan === 0 && project.status === "pembayaran_dp") {
      const { error: updateProjectError } = await adminSupabase
        .from("projects")
        .update({ status: "berjalan" })
        .eq("id", project.id)
        .eq("status", "pembayaran_dp");
      if (updateProjectError) {
        console.error("[Midtrans Verify] Project status update failed:", updateProjectError);
        throw new ServiceError("Gagal memperbarui status proyek.", 500);
      }
    }

    return NextResponse.json({
      paid: true,
      transaction_status: transaction.transaction_status,
    });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("[Midtrans Verify] Failed to verify payment:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memeriksa pembayaran." },
      { status: 500 },
    );
  }
}
