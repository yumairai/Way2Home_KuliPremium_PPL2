import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  addResolutionDiscussion,
  followUpKendala,
  saveIssueResolution,
} from "@/services/supervisor.service";
import { jsonError, readJson } from "@/services/http";
import type { IssueResolution } from "@/data/pengawas";

type Body = {
  resolution_id?: string;
  solusi: string;
  source?: "Pengawas" | "Analisis AI";
  analisis_ai?: {
    summary: string;
    options: string[];
    selectedOption: number | null;
  } | null;
  butuh_persetujuan?: boolean;
  alasan_persetujuan?: string;
  bukti?: string | null;
  umpan_balik_customer?: string | null;
  status?: IssueResolution["status"];
  keputusan_final?: boolean;
  discussion?: { author?: "Pengawas" | "Customer"; message?: string };
  tindak_lanjut?: string;
};

/**
 * PUT /api/pengawas/kendala/[id]/resolution
 *
 * Buat atau perbarui penanganan kendala dalam satu permintaan:
 * solusi (opsional disertai hasil analisis AI), diskusi penanganan,
 * serta tindak lanjut yang diteruskan ke mandor.
 *
 * `resolution_id` dikirim bila penanganan sudah tersimpan.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<Body>(request);
    if (!body) {
      return NextResponse.json(
        { message: "Body permintaan tidak terbaca." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const resolutionId = await saveIssueResolution(
      supabase,
      id,
      {
        solusi: String(body.solusi ?? ""),
        source: body.source,
        analisisAi: body.analisis_ai ?? null,
        butuhPersetujuan: body.butuh_persetujuan,
        alasanPersetujuan: body.alasan_persetujuan,
        bukti: body.bukti ?? null,
        umpanBalikCustomer: body.umpan_balik_customer ?? null,
        status: body.status,
        keputusanFinal: body.keputusan_final,
      },
      body.resolution_id,
    );

    if (body.discussion?.message?.trim()) {
      await addResolutionDiscussion(
        supabase,
        resolutionId,
        body.discussion.author === "Customer" ? "Customer" : "Pengawas",
        body.discussion.message,
      );
    }

    if (body.tindak_lanjut?.trim()) {
      await followUpKendala(supabase, id, body.tindak_lanjut);
    }

    return NextResponse.json({ success: true, resolutionId });
  } catch (error) {
    return jsonError(
      error,
      "PUT /api/pengawas/kendala/[id]/resolution",
      "Gagal menyimpan penanganan kendala.",
    );
  }
}
