import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDesignBySlug } from "@/services/design.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const design = await getDesignBySlug(supabase, slug);
    if (!design) {
      return NextResponse.json(
        { message: "Desain rumah tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(design);
  } catch (error: unknown) {
    console.error("Error in GET /api/designs/[slug]:", error);
    return NextResponse.json(
      { message: "Gagal mengambil detail desain." },
      { status: 500 }
    );
  }
}
