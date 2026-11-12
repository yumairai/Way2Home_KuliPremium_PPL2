import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { assertProjectOwner, requireUser, ServiceError } from "@/services/access.service";
import { jsonError, readJson } from "@/services/http";

type Body = {
  decision: "approve" | "reject";
  feedback?: string;
};

/**
 * POST /api/projects/[id]/resolutions/[resolutionId]/decision
 * Memungkinkan Customer menyetujui atau meminta revisi atas usulan penanganan kendala.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; resolutionId: string }> },
) {
  const { id, resolutionId } = await params;

  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    await assertProjectOwner(supabase, id, user.id);

    const body = await readJson<Body>(request);
    const decision = body?.decision;

    if (decision !== "approve" && decision !== "reject") {
      throw new ServiceError("Keputusan harus 'approve' atau 'reject'.", 400);
    }

    const { data: resolution, error: resError } = await supabase
      .from("issue_resolutions")
      .select("id, status, kendala_id")
      .eq("id", resolutionId)
      .eq("project_id", id)
      .maybeSingle();

    if (resError || !resolution) {
      throw new ServiceError("Penanganan kendala tidak ditemukan.", 404);
    }

    if (decision === "approve") {
      const feedback = "Usulan disetujui customer.";

      const { error: updateError } = await supabase
        .from("issue_resolutions")
        .update({
          status: "Ditindaklanjuti",
          umpan_balik_customer: feedback,
        })
        .eq("id", resolutionId);

      if (updateError) {
        console.error("[customer-decision] update error:", updateError);
        throw new ServiceError("Gagal menyimpan persetujuan kendala.", 500);
      }

      await supabase.from("resolution_discussions").insert({
        resolution_id: resolutionId,
        penulis: "Customer",
        pesan: feedback,
        created_by: user.id,
      });

      return NextResponse.json({
        success: true,
        status: "Ditindaklanjuti",
        message: "Usulan penanganan kendala berhasil disetujui.",
      });
    } else {
      const feedback = String(body?.feedback ?? "").trim();
      if (feedback.length < 5) {
        throw new ServiceError("Tuliskan alasan penolakan/masukan minimal 5 karakter.", 422);
      }

      const { error: updateError } = await supabase
        .from("issue_resolutions")
        .update({
          status: "Diskusi dengan pengawas",
          umpan_balik_customer: feedback,
        })
        .eq("id", resolutionId);

      if (updateError) {
        console.error("[customer-decision] reject error:", updateError);
        throw new ServiceError("Gagal mengirim tanggapan.", 500);
      }

      await supabase.from("resolution_discussions").insert({
        resolution_id: resolutionId,
        penulis: "Customer",
        pesan: feedback,
        created_by: user.id,
      });

      return NextResponse.json({
        success: true,
        status: "Diskusi dengan pengawas",
        message: "Masukan telah dikirimkan ke pengawas untuk ditinjau.",
      });
    }
  } catch (error) {
    return jsonError(
      error,
      "POST /api/projects/[id]/resolutions/[resolutionId]/decision",
      "Gagal memproses keputusan customer.",
    );
  }
}

