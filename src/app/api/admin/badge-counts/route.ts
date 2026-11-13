import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Count pending document verifications
    const { count: documentCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .in("status", ["verifikasi_dokumen", "revisi_dokumen"]);

    // Count pending mandor verifications
    const { count: mandorCount } = await supabase
      .from("mandor_profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return NextResponse.json({
      documentVerifications: documentCount ?? 0,
      mandorVerifications: mandorCount ?? 0,
    });
  } catch (error) {
    console.error("[GET /api/admin/badge-counts]", error);
    return NextResponse.json(
      { error: "Failed to fetch badge counts" },
      { status: 500 },
    );
  }
}
