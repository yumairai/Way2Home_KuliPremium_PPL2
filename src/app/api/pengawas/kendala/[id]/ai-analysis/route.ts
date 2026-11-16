import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateIssueAiAnalysis } from "@/services/ai-kendala.service";
import { jsonError } from "@/services/http";

/**
 * POST /api/pengawas/kendala/[id]/ai-analysis
 * Memicu analisis risiko kendala lapangan menggunakan AI Engine (Way2Home AI).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const analysis = await generateIssueAiAnalysis(supabase, id);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/pengawas/kendala/[id]/ai-analysis",
      "Gagal melakukan analisis kendala AI.",
    );
  }
}
