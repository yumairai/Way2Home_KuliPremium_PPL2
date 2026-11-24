import { NextResponse } from "next/server";
import { ServiceError } from "@/services/access.service";
import { automateTestProjectSubmission } from "@/services/test-automation.service";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await automateTestProjectSubmission(supabase, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("[test-flow/submit] automation failed", error);
    return NextResponse.json({ message: "Otomasi testing gagal." }, { status: 500 });
  }
}
