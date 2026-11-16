import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getMandorApplication,
  saveMandorDecision,
} from "@/services/mandor-verification.service";
import { ServiceError } from "@/services/access.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const application = await getMandorApplication(await createClient(), id);
    return NextResponse.json({ application });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error("Error in GET /api/admin/mandor-verification/[id]:", error);
    return NextResponse.json(
      { message: "Gagal memuat detail pendaftaran mandor." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      decision?: unknown;
      reason?: unknown;
    };
    if (
      (body.decision !== "approve" && body.decision !== "reject") ||
      (body.reason !== undefined && typeof body.reason !== "string")
    ) {
      return NextResponse.json(
        { message: "Keputusan verifikasi tidak valid." },
        { status: 400 },
      );
    }

    await saveMandorDecision(
      await createClient(),
      id,
      body.decision,
      typeof body.reason === "string" ? body.reason : "",
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error("Error in PATCH /api/admin/mandor-verification/[id]:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan keputusan verifikasi mandor." },
      { status: 500 },
    );
  }
}
