import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { Database } from "@/types/database.types";

const ORDER_ID_PATTERN =
  /^W2H-([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-([0-9a-z]+)$/i;

/**
 * POST /api/midtrans/notification
 *
 * Processes verified Midtrans notifications and updates the matching payment
 * stage. This endpoint requires the Supabase service role key because
 * notifications come from Midtrans without a user session.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ message: "Invalid notification" }, { status: 400 });
    }

    const notification = body as Record<string, unknown>;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const signatureKey = notification.signature_key;
    const transactionStatus = notification.transaction_status;

    if (
      typeof orderId !== "string" ||
      typeof statusCode !== "string" ||
      typeof grossAmount !== "string" ||
      typeof signatureKey !== "string" ||
      typeof transactionStatus !== "string"
    ) {
      return NextResponse.json({ message: "Invalid notification" }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serverKey || !supabaseUrl || !serviceRoleKey) {
      console.error("[Midtrans Notification] Missing required server configuration.");
      return NextResponse.json(
        { message: "Payment notification configuration error" },
        { status: 500 },
      );
    }

    const expectedSignature = crypto
      .createHash("sha512")
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest("hex");
    const receivedSignature = Buffer.from(signatureKey, "hex");
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");
    if (
      receivedSignature.length !== expectedSignatureBuffer.length ||
      !crypto.timingSafeEqual(receivedSignature, expectedSignatureBuffer)
    ) {
      console.error("[Midtrans Notification] Invalid signature.");
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

    const orderMatch = ORDER_ID_PATTERN.exec(orderId);
    if (!orderMatch) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const isSuccess =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" &&
        notification.fraud_status === "accept");
    if (!isSuccess) {
      return NextResponse.json({ message: "OK" });
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);
    const paymentStageId = orderMatch[1];
    const { data: paymentStage, error: stageErr } = await supabase
      .from("payment_stages")
      .select("id, project_id, urutan, nominal, status")
      .eq("id", paymentStageId)
      .maybeSingle();

    if (stageErr) {
      throw stageErr;
    }
    if (!paymentStage) {
      console.error(
        "[Midtrans Notification] Payment stage not found:",
        paymentStageId,
      );
      return NextResponse.json({ message: "Payment stage not found" }, { status: 404 });
    }
    if (
      !Number.isFinite(Number(grossAmount)) ||
      Number(grossAmount) !== Number(paymentStage.nominal)
    ) {
      console.error(
        "[Midtrans Notification] Amount mismatch for stage:",
        paymentStageId,
      );
      return NextResponse.json({ message: "Amount mismatch" }, { status: 400 });
    }

    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", paymentStage.project_id)
      .maybeSingle();
    if (projectErr) {
      throw projectErr;
    }
    if (!project) {
      throw new Error(`Project ${paymentStage.project_id} for payment stage not found.`);
    }

    if (paymentStage.status !== "lunas") {
      const { error: updateStageErr } = await supabase
        .from("payment_stages")
        .update({
          status: "lunas",
          tanggal_bayar: new Date().toISOString(),
        })
        .eq("id", paymentStage.id)
        .neq("status", "lunas");

      if (updateStageErr) {
        throw updateStageErr;
      }
    }

    if (paymentStage.urutan === 0 && project.status === "pembayaran_dp") {
      const { error: updateProjectErr } = await supabase
        .from("projects")
        .update({
          status: "berjalan" satisfies Database["public"]["Enums"]["project_status"],
        })
        .eq("id", project.id)
        .eq("status", "pembayaran_dp");

      if (updateProjectErr) {
        throw updateProjectErr;
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("[Midtrans Notification] Failed to process notification:", error);
    return NextResponse.json(
      { message: "Failed to process notification" },
      { status: 500 },
    );
  }
}
