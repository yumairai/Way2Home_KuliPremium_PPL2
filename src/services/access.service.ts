import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/types/database.types";

export class ServiceError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.data = data;
  }
}

export async function requireUser(
  supabase: SupabaseClient<Database>,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ServiceError("Anda harus login terlebih dahulu.", 401);
  }

  return user;
}

export async function requireRole(
  supabase: SupabaseClient<Database>,
  expectedRole: UserRole,
): Promise<{ user: User; role: UserRole }> {
  const user = await requireUser(supabase);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new ServiceError("Profil pengguna tidak ditemukan.", 403);
  }

  if (profile.role !== expectedRole) {
    throw new ServiceError(
      `Akses ditolak. Peran Anda (${profile.role}) tidak memiliki izin untuk tindakan ini.`,
      403,
    );
  }

  return { user, role: profile.role as UserRole };
}

export async function assertProjectOwner(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    throw new ServiceError("Proyek tidak ditemukan.", 404);
  }

  if (project.customer_id !== userId) {
    throw new ServiceError("Anda tidak memiliki hak akses ke proyek ini.", 403);
  }

  return project;
}
