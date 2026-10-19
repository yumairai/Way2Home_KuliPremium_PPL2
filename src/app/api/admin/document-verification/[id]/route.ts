import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { saveDocumentVerification } from "@/services/admin-verification.service";
import { ServiceError } from "@/services/access.service";
import type { VerificationDocumentStatus } from "@/data/admin-verification";

const statuses: VerificationDocumentStatus[] = ["Menunggu", "Disetujui", "Ditolak"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      decisions?: Array<{ id?: string; status?: VerificationDocumentStatus }>;
      adminNote?: string;
    };
    if (
      !Array.isArray(body.decisions) ||
      body.decisions.some(
        (decision) =>
          typeof decision.id !== "string" ||
          !statuses.includes(decision.status as VerificationDocumentStatus),
      ) ||
      typeof body.adminNote !== "string"
    ) {
      return NextResponse.json({ message: "Format hasil review tidak valid." }, { status: 400 });
    }

    const supabase = await createClient();
    await saveDocumentVerification(
      supabase,
      id,
      body.decisions as Array<{ id: string; status: VerificationDocumentStatus }>,
      body.adminNote,
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Error in PATCH /api/admin/document-verification/[id]:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan hasil review dokumen." },
      { status: 500 },
    );
  }
}