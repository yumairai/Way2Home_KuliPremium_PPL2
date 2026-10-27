import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  createProjectStages,
  createStagesFromTemplate,
  type StageInput,
} from "@/services/stage.service";
import { ServiceError } from "@/services/access.service";
import { jsonError, readJson } from "@/services/http";

type Body = {
  template?: boolean;
  tanggal_mulai?: (string | null)[];
  tanggal_selesai?: (string | null)[];
  keterangan?: (string | null)[];
  stages?: StageInput[];
};

/**
 * POST /api/pengawas/projects/[id]/stages
 *
 * Tahapan dibuat MANUAL oleh Pengawas (tidak ada pembuatan otomatis).
 * Dua bentuk payload:
 *   { "template": true }                       -> pakai template 6 tahap / 24 subtask
 *   { "stages": [ { nama_tahap, subtasks: [] } ] }
 *
 * Menolak dengan 409 bila proyek sudah memiliki tahapan.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await readJson<Body>(request);

    const supabase = await createClient();

    if (body?.template === true) {
      await createStagesFromTemplate(supabase, id, {
        tanggal_mulai: body.tanggal_mulai,
        tanggal_selesai: body.tanggal_selesai,
        keterangan: body.keterangan,
      });
      return NextResponse.json({ created: true, source: "template" });
    }

    if (!Array.isArray(body?.stages) || body.stages.length === 0) {
      throw new ServiceError(
        'Kirim { "template": true } atau daftar "stages" minimal satu tahap.',
        422,
      );
    }

    const stages: StageInput[] = body.stages.map((stage, index) => ({
      nama_tahap: String(stage.nama_tahap ?? ""),
      urutan: stage.urutan ?? index + 1,
      keterangan: stage.keterangan ?? null,
      tanggal_mulai: stage.tanggal_mulai ?? null,
      tanggal_selesai: stage.tanggal_selesai ?? null,
      subtasks: (Array.isArray(stage.subtasks) ? stage.subtasks : []).map(
        (subtask, subIndex) => ({
          judul: String(subtask.judul ?? ""),
          bobot: Number(subtask.bobot ?? 0),
          urutan: subtask.urutan ?? subIndex + 1,
          target_selesai: subtask.target_selesai ?? null,
        }),
      ),
    }));

    await createProjectStages(supabase, id, stages);

    return NextResponse.json({ created: true, source: "manual" });
  } catch (error) {
    return jsonError(
      error,
      "POST /api/pengawas/projects/[id]/stages",
      "Gagal membuat tahapan proyek.",
    );
  }
}
