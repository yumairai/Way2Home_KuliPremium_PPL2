/**
 * allocation.service.ts
 *
 * Service untuk:
 * - Fitur 1: Admin mengalokasikan Pengawas ke proyek (update projects.pengawas_id)
 * - Fitur 2: Pengawas mengalokasikan Mandor ke proyek (insert into project_mandors)
 *
 * Semua validasi otoritas dilakukan di level database (RLS).
 * Tidak ada service-role key yang diekspos ke frontend.
 *
 * Pattern query mengikuti project.service.ts:
 *   data.map((row: Record<string, unknown>) => ...)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireRole, ServiceError } from "./access.service";

// ============================================================
// TYPES
// ============================================================

export type ProjectForAdmin = {
  id: string;
  status: string;
  created_at: string;
  alamat_proyek: string | null;
  pengawas_id: string | null;
  pengawas_name: string | null;
  customer_name: string;
  customer_phone: string | null;
  design_name: string;
};

export type PengawasOption = {
  id: string;
  full_name: string;
  phone: string | null;
  spesialisasi: string | null;
  aktif: boolean;
  available: boolean;
};

export type ProjectForPengawas = {
  id: string;
  status: string;
  created_at: string;
  alamat_proyek: string | null;
  design_name: string;
  customer_name: string;
  mandors: AllocatedMandor[];
};

export type AllocatedMandor = {
  mandor_id: string;
  full_name: string;
  phone: string | null;
  keahlian: string[];
  area_kerja: string | null;
  pengalaman_tahun: number | null;
  assigned_at: string;
};

export type VerifiedMandor = {
  id: string;
  full_name: string;
  phone: string | null;
  keahlian: string[];
  area_kerja: string | null;
  pengalaman_tahun: number | null;
};

export function canAllocateStaff(status: string) {
  return status === "alokasi_mandor_pengawas";
}

export async function finalizeProjectStaffing(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<void> {
  const { user } = await requireRole(supabase, "pengawas");
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("pengawas_id, status")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    console.error("[finalizeProjectStaffing] project lookup error:", projectError);
    throw new ServiceError("Proyek tidak ditemukan.", 404);
  }

  const projectRow = project as Record<string, unknown>;
  if (projectRow.pengawas_id !== user.id) {
    throw new ServiceError("Anda tidak ditugaskan ke proyek ini.", 403);
  }
  if (projectRow.status !== "alokasi_mandor_pengawas") {
    throw new ServiceError(
      "Proyek ini tidak sedang berada di tahap alokasi tim.",
      409,
    );
  }

  const { count, error: mandorError } = await supabase
    .from("project_mandors")
    .select("mandor_id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (mandorError) {
    console.error("[finalizeProjectStaffing] mandor lookup error:", mandorError);
    throw new ServiceError(
      "Gagal memeriksa mandor yang sudah dialokasikan.",
      500,
    );
  }
  if (!count) {
    throw new ServiceError(
      "Alokasikan minimal satu mandor sebelum melanjutkan.",
      409,
    );
  }
  if (count > 3) {
    throw new ServiceError(
      "Satu proyek hanya dapat memiliki maksimal 3 mandor.",
      409,
    );
  }

  // Recheck status and roster immediately before changing the project stage.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("projects")
    .update({ status: "finalisasi_kontrak" })
    .eq("id", projectId)
    .eq("pengawas_id", user.id)
    .eq("status", "alokasi_mandor_pengawas")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[finalizeProjectStaffing] update error:", error);
    throw new ServiceError(
      error.code === "23514"
        ? error.message
        : "Gagal menyelesaikan alokasi tim.",
      error.code === "23514" ? 409 : 500,
    );
  }
  if (!data) {
    throw new ServiceError(
      "Status proyek berubah. Muat ulang halaman lalu coba lagi.",
      409,
    );
  }
}

// ============================================================
// FITUR 1 — ADMIN: ALOKASI PENGAWAS
// ============================================================

/**
 * Ambil semua proyek lengkap dengan info customer & pengawas saat ini.
 * RLS: is_project_member(id) includes get_my_role() = 'admin'
 */
export async function getProjectsForAdmin(
  supabase: SupabaseClient<Database>,
): Promise<ProjectForAdmin[]> {
  await requireRole(supabase, "admin");

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      status,
      created_at,
      alamat_proyek,
      pengawas_id,
      designs ( nama ),
      profiles!projects_customer_id_fkey ( full_name, phone ),
      pengawas_profiles (
        profiles!pengawas_profiles_id_fkey ( full_name )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getProjectsForAdmin] error:", error);
    throw new ServiceError("Gagal memuat daftar proyek.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const design = (row.designs as Record<string, unknown>) || {};
    const customer = (row.profiles as Record<string, unknown>) || {};
    const pengawasRow = (row.pengawas_profiles as Record<string, unknown>) || {};
    const pengawasProfile = (pengawasRow.profiles as Record<string, unknown>) || {};

    return {
      id: (row.id as string) ?? "",
      status: (row.status as string) ?? "draft",
      created_at: (row.created_at as string) ?? "",
      alamat_proyek: (row.alamat_proyek as string | null) ?? null,
      pengawas_id: (row.pengawas_id as string | null) ?? null,
      pengawas_name: (pengawasProfile.full_name as string | null) ?? null,
      customer_name: (customer.full_name as string) || "-",
      customer_phone: (customer.phone as string | null) ?? null,
      design_name: (design.nama as string) || "Desain Tidak Diketahui",
    };
  });
}

/**
 * Ambil semua akun Pengawas yang aktif.
 * RLS pengawas_select: true (semua role bisa baca)
 */
export async function getActivePengawas(
  supabase: SupabaseClient<Database>,
): Promise<PengawasOption[]> {
  await requireRole(supabase, "admin");

  const [
    { data, error },
    { data: assignedProjects, error: assignedError },
  ] = await Promise.all([
    supabase
      .from("pengawas_profiles")
      .select(`
      id,
      spesialisasi,
      aktif,
      profiles!pengawas_profiles_id_fkey ( full_name, phone )
    `)
      .eq("aktif", true),
    supabase
      .from("projects")
      .select("pengawas_id")
      .not("status", "in", "(selesai,batal)")
      .not("pengawas_id", "is", null),
  ]);

  if (error) {
    console.error("[getActivePengawas] error:", error);
    throw new ServiceError("Gagal memuat daftar pengawas.", 500);
  }
  if (assignedError) {
    console.error("[getActivePengawas] assigned projects error:", assignedError);
    throw new ServiceError("Gagal memeriksa ketersediaan pengawas.", 500);
  }

  const busyIds = new Set(
    (assignedProjects ?? []).map(
      (row: Record<string, unknown>) => row.pengawas_id as string,
    ),
  );

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = (row.profiles as Record<string, unknown>) || {};
    return {
      id: (row.id as string) ?? "",
      full_name: (profile.full_name as string) || "-",
      phone: (profile.phone as string | null) ?? null,
      spesialisasi: (row.spesialisasi as string | null) ?? null,
      aktif: row.aktif === true,
      available: !busyIds.has((row.id as string) ?? ""),
    };
  });
}

/**
 * Alokasikan satu Pengawas ke satu proyek.
 *
 * Aturan:
 * - Hanya Admin yang dapat update (RLS projects_update: get_my_role() = 'admin').
 * - Alokasi bersifat immutable: cek pengawas_id === null dulu.
 * - Guard: .is("pengawas_id", null) agar concurrent request aman.
 */
export async function assignPengawasToProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  pengawasId: string,
): Promise<void> {
  await requireRole(supabase, "admin");

  const { data: existing, error: checkErr } = await supabase
    .from("projects")
    .select("pengawas_id, status")
    .eq("id", projectId)
    .single();

  if (checkErr || !existing) {
    throw new ServiceError("Proyek tidak ditemukan.", 404);
  }

  const existingRow = existing as Record<string, unknown>;
  if (existingRow.pengawas_id !== null && existingRow.pengawas_id !== undefined) {
    throw new ServiceError(
      "Proyek ini sudah memiliki pengawas dan tidak dapat dialokasikan ulang.",
      409,
    );
  }

  if (!canAllocateStaff(existingRow.status as string)) {
    throw new ServiceError(
      "Pengawas hanya dapat dialokasikan setelah dokumen proyek berhasil diverifikasi.",
      409,
    );
  }

  const { data: busyProject, error: busyError } = await supabase
    .from("projects")
    .select("id")
    .eq("pengawas_id", pengawasId)
    .not("status", "in", "(selesai,batal)")
    .limit(1)
    .maybeSingle();

  if (busyError) {
    console.error("[assignPengawasToProject] availability error:", busyError);
    throw new ServiceError("Gagal memeriksa ketersediaan pengawas.", 500);
  }
  if (busyProject) {
    throw new ServiceError(
      "Pengawas tersebut masih menangani proyek aktif lain.",
      409,
    );
  }

  // Cast needed: SupabaseClient<Database> Update type resolves to never when relationships are incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("projects")
    .update({ pengawas_id: pengawasId })
    .eq("id", projectId)
    .is("pengawas_id", null);

  if (error) {
    console.error("[assignPengawasToProject] error:", error);
    throw new ServiceError(
      error.code === "23514" || error.code === "23505"
        ? error.message
        : "Gagal mengalokasikan pengawas.",
      error.code === "23514" || error.code === "23505" ? 409 : 500,
    );
  }
}

// ============================================================
// FITUR 2 — PENGAWAS: ALOKASI MANDOR
// ============================================================

/**
 * Ambil proyek milik pengawas yang sedang login beserta mandor teralokasi.
 * RLS: pengawas melihat proyek via is_project_member (pengawas_id = auth.uid()).
 */
export async function getProjectsForPengawas(
  supabase: SupabaseClient<Database>,
): Promise<ProjectForPengawas[]> {
  await requireRole(supabase, "pengawas");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ServiceError("Sesi tidak valid.", 401);

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      status,
      created_at,
      alamat_proyek,
      designs ( nama ),
      profiles!projects_customer_id_fkey ( full_name ),
      project_mandors (
        mandor_id,
        assigned_at,
        mandor_profiles (
          keahlian,
          area_kerja,
          pengalaman_tahun,
          profiles!mandor_profiles_id_fkey ( full_name, phone )
        )
      )
    `)
    .eq("pengawas_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getProjectsForPengawas] error:", error);
    throw new ServiceError("Gagal memuat proyek Anda.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const design = (row.designs as Record<string, unknown>) || {};
    const customer = (row.profiles as Record<string, unknown>) || {};
    const rawMandors = Array.isArray(row.project_mandors)
      ? (row.project_mandors as Record<string, unknown>[])
      : [];

    const mandors: AllocatedMandor[] = rawMandors.map((pm) => {
      const mandorProfile = (pm.mandor_profiles as Record<string, unknown>) || {};
      const mandorUser = (mandorProfile.profiles as Record<string, unknown>) || {};
      return {
        mandor_id: (pm.mandor_id as string) ?? "",
        full_name: (mandorUser.full_name as string) || "-",
        phone: (mandorUser.phone as string | null) ?? null,
        keahlian: Array.isArray(mandorProfile.keahlian)
          ? (mandorProfile.keahlian as string[])
          : [],
        area_kerja: (mandorProfile.area_kerja as string | null) ?? null,
        pengalaman_tahun:
          typeof mandorProfile.pengalaman_tahun === "number"
            ? mandorProfile.pengalaman_tahun
            : null,
        assigned_at: (pm.assigned_at as string) ?? "",
      };
    });

    return {
      id: (row.id as string) ?? "",
      status: (row.status as string) ?? "draft",
      created_at: (row.created_at as string) ?? "",
      alamat_proyek: (row.alamat_proyek as string | null) ?? null,
      design_name: (design.nama as string) || "-",
      customer_name: (customer.full_name as string) || "-",
      mandors,
    };
  });
}

/**
 * Ambil semua Mandor terverifikasi (status = 'approved').
 * RLS mandor_select: status = 'approved' OR get_my_role() in ('admin','pengawas')
 */
export async function getVerifiedMandors(
  supabase: SupabaseClient<Database>,
): Promise<VerifiedMandor[]> {
  await requireRole(supabase, "pengawas");

  const { data: availableIds, error: availabilityError } = await supabase
    .rpc("get_available_mandor_ids")
    .overrideTypes<string[], { merge: false }>();

  if (availabilityError) {
    console.error("[getVerifiedMandors] availability error:", availabilityError);
    throw new ServiceError("Gagal memeriksa ketersediaan mandor.", 500);
  }
  if (availableIds.length === 0) return [];

  const { data, error } = await supabase
    .from("mandor_profiles")
    .select(`
      id,
      keahlian,
      area_kerja,
      pengalaman_tahun,
      profiles!mandor_profiles_id_fkey ( full_name, phone )
    `)
    .eq("status", "approved")
    .in("id", availableIds);

  if (error) {
    console.error("[getVerifiedMandors] error:", error);
    throw new ServiceError("Gagal memuat daftar mandor.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = (row.profiles as Record<string, unknown>) || {};
    return {
      id: (row.id as string) ?? "",
      full_name: (profile.full_name as string) || "-",
      phone: (profile.phone as string | null) ?? null,
      keahlian: Array.isArray(row.keahlian) ? (row.keahlian as string[]) : [],
      area_kerja: (row.area_kerja as string | null) ?? null,
      pengalaman_tahun:
        typeof row.pengalaman_tahun === "number" ? row.pengalaman_tahun : null,
    };
  });
}

/**
 * Alokasikan beberapa Mandor ke satu proyek.
 *
 * Server-side validation via RLS:
 * - is_project_pengawas(project_id): pengawas hanya bisa kelola proyek miliknya.
 * - mandor status = 'approved': with check di RLS project_mandors_pengawas_manage.
 * - Composite PK (project_id, mandor_id): mencegah duplikasi di level DB.
 *
 * Client-side: cek dulu mandor yang sudah ada supaya tidak hit constraint error.
 */
export async function assignMandorsToProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  mandorIds: string[],
): Promise<{ assigned: number; skipped: number }> {
  const { user } = await requireRole(supabase, "pengawas");

  if (mandorIds.length === 0) {
    throw new ServiceError("Pilih minimal satu mandor.", 400);
  }

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("pengawas_id, status")
    .eq("id", projectId)
    .single();

  if (projectErr || !project) {
    throw new ServiceError("Proyek tidak ditemukan.", 404);
  }

  const projectRow = project as Record<string, unknown>;
  if (projectRow.pengawas_id !== user.id) {
    throw new ServiceError("Anda tidak ditugaskan ke proyek ini.", 403);
  }
  if (!canAllocateStaff(projectRow.status as string)) {
    throw new ServiceError(
      "Mandor hanya dapat dialokasikan setelah dokumen proyek berhasil diverifikasi.",
      409,
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("project_mandors")
    .select("mandor_id")
    .eq("project_id", projectId);

  if (existingError) {
    console.error(
      "[assignMandorsToProject] existing mandors error:",
      existingError,
    );
    throw new ServiceError(
      "Gagal memeriksa mandor yang sudah dialokasikan.",
      500,
    );
  }

  const existingIds = new Set(
    (existing ?? []).map((r: Record<string, unknown>) => r.mandor_id as string),
  );
  const newMandorIds = [...new Set(mandorIds)].filter(
    (id) => !existingIds.has(id),
  );
  const skipped = mandorIds.length - newMandorIds.length;

  if (newMandorIds.length === 0) {
    return { assigned: 0, skipped };
  }

  if (existingIds.size + newMandorIds.length > 3) {
    throw new ServiceError(
      "Satu proyek hanya dapat memiliki maksimal 3 mandor.",
      409,
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("mandor_profiles")
    .select("id, keahlian")
    .in("id", [...existingIds, ...newMandorIds]);

  if (profilesError) {
    console.error("[assignMandorsToProject] skills error:", profilesError);
    throw new ServiceError("Gagal memeriksa keahlian mandor.", 500);
  }

  const skillSets = new Map(
    (profiles ?? []).map((row: Record<string, unknown>) => [
      row.id as string,
      Array.isArray(row.keahlian) ? (row.keahlian as string[]) : [],
    ]),
  );
  const assignedSkills = new Set<string>();
  for (const mandorId of existingIds) {
    for (const skill of skillSets.get(mandorId) ?? []) assignedSkills.add(skill);
  }
  for (const mandorId of newMandorIds) {
    const skills = skillSets.get(mandorId) ?? [];
    if (skills.length === 0) {
      throw new ServiceError(
        "Mandor harus memiliki keahlian yang tercatat sebelum dialokasikan.",
        409,
      );
    }
    if (skills.some((skill) => assignedSkills.has(skill))) {
      throw new ServiceError(
        "Setiap mandor dalam satu proyek harus memiliki keahlian yang berbeda.",
        409,
      );
    }
    for (const skill of skills) assignedSkills.add(skill);
  }

  const rows = newMandorIds.map((mandorId) => ({
    project_id: projectId,
    mandor_id: mandorId,
    assigned_by: user.id,
  }));

  // Cast needed: project_mandors Insert type resolves to never when relationships are incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (supabase as any)
    .from("project_mandors")
    .insert(rows);

  if (insertErr) {
    console.error("[assignMandorsToProject] error:", insertErr);
    throw new ServiceError(
      insertErr.code === "23514" || insertErr.code === "23505"
        ? insertErr.message
        : `Gagal mengalokasikan mandor: ${insertErr.message}`,
      insertErr.code === "23514" || insertErr.code === "23505" ? 409 : 500,
    );
  }

  return { assigned: newMandorIds.length, skipped };
}

/**
 * Hapus alokasi satu Mandor dari proyek.
 * RLS: is_project_pengawas(project_id) or get_my_role() = 'admin'
 */
export async function removeMandorFromProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  mandorId: string,
): Promise<void> {
  await requireRole(supabase, "pengawas");

  const { error } = await supabase
    .from("project_mandors")
    .delete()
    .eq("project_id", projectId)
    .eq("mandor_id", mandorId);

  if (error) {
    console.error("[removeMandorFromProject] error:", error);
    throw new ServiceError("Gagal menghapus mandor dari proyek.", 500);
  }
}
