import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSignedDocumentUrl } from "@/services/project.service";
import { ServiceError } from "@/services/access.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const { docId } = await params;
    const supabase = await createClient();

    const signedUrl = await getSignedDocumentUrl(supabase, docId);
    return NextResponse.json({ signedUrl });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("Error in GET signed-url:", error);
    return NextResponse.json(
      { message: "Gagal mengambil URL dokumen." },
      { status: 500 },
    );
  }
}
