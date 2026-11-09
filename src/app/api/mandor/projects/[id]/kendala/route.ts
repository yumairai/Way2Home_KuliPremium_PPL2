import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { submitKendala } from "@/services/mandor.service";
import { jsonError, readJson } from "@/services/http";
import type {
  MandorIssueCategory,
  MandorIssueCondition,
} from "@/data/mandor";

/**
 * POST /api/mandor/projects/[id]/kendala
 * Laporkan kendala lapangan. Status awal 'reported' (Menunggu) dan
 * tidak mengubah progres resmi.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<{
      project_stage_id?: string;
      project_subtask_id?: string;
      kategori?: MandorIssueCategory;
      deskripsi?: string;
      kondisi_pekerjaan?: MandorIssueCondition;
      dampak_waktu_hari?: number;
      informasi_tambahan?: string;
      lampiran?: string | null;
      lampiran_nama?: string;
    }>(request);

    const supabase = await createClient();
    const issue = await submitKendala(supabase, id, {
      project_stage_id: String(body?.project_stage_id ?? ""),
      project_subtask_id: String(body?.project_subtask_id ?? ""),
      kategori: (body?.kategori ?? "LAINNYA") as MandorIssueCategory,
      deskripsi: String(body?.deskripsi ?? ""),
      kondisi_pekerjaan: (body?.kondisi_pekerjaan ??
        "BERJALAN") as MandorIssueCondition,
      dampak_waktu_hari: Number(body?.dampak_waktu_hari ?? 0),
      informasi_tambahan: body?.informasi_tambahan,
      lampiran: body?.lampiran ?? null,
      lampiran_nama: body?.lampiran_nama,
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/mandor/projects/[id]/kendala",
      "Gagal mengirim laporan kendala.",
    );
  }
}
