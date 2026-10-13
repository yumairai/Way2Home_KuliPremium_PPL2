import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDesigns } from "@/services/design.service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      query: searchParams.get("query") || searchParams.get("q") || undefined,
      style: searchParams.get("style") || undefined,
      minPrice: searchParams.has("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.has("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      minLand: searchParams.has("minLand") ? Number(searchParams.get("minLand")) : undefined,
      maxLand: searchParams.has("maxLand") ? Number(searchParams.get("maxLand")) : undefined,
      minBuilding: searchParams.has("minBuilding") ? Number(searchParams.get("minBuilding")) : undefined,
      maxBuilding: searchParams.has("maxBuilding") ? Number(searchParams.get("maxBuilding")) : undefined,
      bedrooms: searchParams.get("bedrooms") || undefined,
      sort: searchParams.get("sort") || undefined,
    };

    const designs = await getDesigns(supabase, filters);
    return NextResponse.json(designs);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; details?: string; hint?: string; stack?: string };
    // Log detail error untuk debugging (termasuk kode dari Supabase)
    console.error("[GET /api/designs] Error:", {
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
      stack: err?.stack?.slice(0, 400),
    });
    return NextResponse.json(
      { message: err?.message || "Gagal mengambil katalog desain." },
      { status: 500 }
    );
  }
}
