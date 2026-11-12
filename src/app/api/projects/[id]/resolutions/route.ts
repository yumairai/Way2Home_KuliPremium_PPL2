import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { assertProjectOwner, requireUser } from "@/services/access.service";
import { jsonError } from "@/services/http";
import { formatDate } from "@/utils/format";

/**
 * GET /api/projects/[id]/resolutions
 * Mengambil daftar resolusi kendala proyek milik customer.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    await assertProjectOwner(supabase, id, user.id);

    const { data, error } = await supabase
      .from("issue_resolutions")
      .select(`
        id,
        kendala_id,
        solusi,
        alasan_persetujuan,
        bukti,
        status,
        created_at,
        kendala ( kategori, deskripsi ),
        resolution_discussions ( id, penulis, pesan, created_at )
      `)
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const resolutions = (data ?? []).map((res: Record<string, unknown>) => {
      const k = (res.kendala ?? {}) as Record<string, unknown>;
      const rawDisc = Array.isArray(res.resolution_discussions)
        ? (res.resolution_discussions as Record<string, unknown>[])
        : [];
      const discussion = rawDisc.map((d) => ({
        id: String(d.id),
        author: String(d.penulis ?? "Pengawas"),
        message: String(d.pesan ?? ""),
        date: formatDate(String(d.created_at)),
      }));

      return {
        id: String(res.id),
        issueId: String(res.kendala_id),
        issueTitle: String(k.kategori ?? "Kendala Lapangan"),
        solution: String(res.solusi ?? ""),
        approvalReason: String(res.alasan_persetujuan ?? ""),
        approvalEvidence: (res.bukti as string | null) ?? null,
        status: String(res.status ?? ""),
        submittedAt: formatDate(String(res.created_at)),
        discussion,
      };
    });

    return NextResponse.json(resolutions);
  } catch (error) {
    return jsonError(
      error,
      "GET /api/projects/[id]/resolutions",
      "Gagal memuat penanganan kendala customer.",
    );
  }
}

