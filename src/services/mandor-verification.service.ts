import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireRole, ServiceError } from "@/services/access.service";
import { createAdminClient } from "@/utils/supabase/admin";

export type MandorApplication = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  city: string;
  expertise: string;
  skills: string;
  experience: number;
  submitted: string;
  cvUrl: string;
  summary: string;
  projects: string;
  status: "pending" | "approved" | "rejected";
  verificationNote: string | null;
};

type MandorProfile = Database["public"]["Tables"]["mandor_profiles"]["Row"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

async function toApplication(
  supabase: SupabaseClient<Database>,
  adminClient: SupabaseClient<Database>,
  mandor: MandorProfile,
): Promise<MandorApplication> {
  const { data: profileData } = await adminClient
    .from("profiles")
    .select("full_name, phone")
    .eq("id", mandor.id)
    .maybeSingle();

  const profile = profileData as { full_name?: string | null; phone?: string | null } | null;

  let email = "";
  try {
    const { data: authData } = await adminClient.auth.admin.getUserById(mandor.id);
    email = authData?.user?.email || "";
  } catch (err) {
    console.error("[toApplication] getUserById error:", err);
  }

  let cvUrl = "";
  if (mandor.cv_path) {
    try {
      const { data: signedUrl, error: signedUrlError } = await adminClient.storage
        .from("mandor-cvs")
        .createSignedUrl(mandor.cv_path, 3600);
      if (!signedUrlError && signedUrl?.signedUrl) {
        cvUrl = signedUrl.signedUrl;
      }
    } catch (err) {
      console.error("[toApplication] createSignedUrl error:", err);
    }
  }

  const name = profile?.full_name || "Calon Mandor";
  const skills = mandor.keahlian || [];
  return {
    id: mandor.id,
    name,
    initials: initials(name),
    email,
    phone: profile?.phone || "-",
    city: mandor.area_kerja || "-",
    expertise: skills[0] || "-",
    skills: skills.length > 1 ? skills.slice(1).join(", ") : (skills[0] || "-"),
    experience: mandor.pengalaman_tahun || 0,
    submitted: formatDateTime(mandor.created_at),
    cvUrl,
    summary: mandor.ringkasan_pengalaman || "-",
    projects: mandor.proyek_sebelumnya || "-",
    status: mandor.status,
    verificationNote: mandor.catatan_verifikasi,
  };
}

export async function getMandorApplications(
  supabase: SupabaseClient<Database>,
): Promise<MandorApplication[]> {
  await requireRole(supabase, "admin");
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("mandor_profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMandorApplications] error:", error);
    throw new ServiceError("Gagal memuat antrean verifikasi mandor.", 500);
  }

  const rows = (data ?? []) as MandorProfile[];
  return Promise.all(
    rows.map((mandor) => toApplication(adminClient, adminClient, mandor)),
  );
}

export async function getMandorApplication(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<MandorApplication> {
  await requireRole(supabase, "admin");
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("mandor_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getMandorApplication] error:", error);
    throw new ServiceError("Gagal memuat detail pendaftaran mandor.", 500);
  }
  if (!data) throw new ServiceError("Pendaftaran mandor tidak ditemukan.", 404);

  return toApplication(adminClient, adminClient, data as MandorProfile);
}

export async function saveMandorDecision(
  supabase: SupabaseClient<Database>,
  id: string,
  decision: "approve" | "reject",
  _reason = "",
): Promise<void> {
  void _reason;
  const { user } = await requireRole(supabase, "admin");

  const adminClient = createAdminClient();

  // Pastikan pendaftaran mandor ada dan masih berstatus pending
  const { data: mandor, error: lookupError } = await adminClient
    .from("mandor_profiles")
    .select("id, cv_path, status")
    .eq("id", id)
    .maybeSingle();

  if (lookupError || !mandor) {
    throw new ServiceError("Pendaftaran mandor tidak ditemukan.", 404);
  }

  if (mandor.status !== "pending") {
    throw new ServiceError(
      "Pendaftaran tidak ditemukan atau sudah diproses.",
      409,
    );
  }

  // Jika ditolak, langsung hapus berkas CV dan akun mandor dari sistem
  // sehingga calon mandor dapat mendaftar ulang kembali dengan email yang sama.
  if (decision === "reject") {
    // 1. Hapus berkas CV dari storage bucket jika ada
    if (mandor.cv_path) {
      try {
        await adminClient.storage.from("mandor-cvs").remove([mandor.cv_path]);
      } catch (err) {
        console.warn("[saveMandorDecision] Gagal menghapus file CV:", err);
      }
    }

    // 2. Hapus data mandor_profiles dan profiles
    try {
      await adminClient.from("mandor_profiles").delete().eq("id", id);
      await adminClient.from("profiles").delete().eq("id", id);
    } catch (err) {
      console.warn("[saveMandorDecision] Gagal menghapus tabel profil:", err);
    }

    // 3. Hapus akun dari auth.users
    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(id);

    if (deleteUserError) {
      console.error(
        "[saveMandorDecision] Gagal menghapus user dari Supabase auth:",
        deleteUserError,
      );
      throw new ServiceError(
        deleteUserError.message || "Gagal menghapus akun mandor yang ditolak.",
        500,
      );
    }

    return;
  }

  // Jika disetujui (approve):
  // Gunakan client authenticated admin agar context session Postgres (auth.uid)
  // terbaca sehingga fungsi get_my_role() = 'admin' lolos di RLS dan database trigger.
  let { data, error } = await supabase
    .from("mandor_profiles")
    .update({
      status: "approved",
      catatan_verifikasi: null,
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  // Fallback ke adminClient jika client session terkendala
  if (error) {
    console.warn(
      "[saveMandorDecision] Update via user session client gagal, mencoba adminClient:",
      error,
    );
    const adminRes = await adminClient
      .from("mandor_profiles")
      .update({
        status: "approved",
        catatan_verifikasi: null,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (!adminRes.error) {
      data = adminRes.data;
      error = null;
    }
  }

  if (error) {
    console.error("[saveMandorDecision] update error:", error);
    throw new ServiceError(
      (error as { message?: string })?.message ||
        "Gagal menyimpan keputusan verifikasi mandor.",
      500,
    );
  }
  if (!data) {
    throw new ServiceError(
      "Pendaftaran tidak ditemukan atau sudah diproses.",
      409,
    );
  }
}
