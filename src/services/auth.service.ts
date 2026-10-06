import { createClient } from "@/utils/supabase/client";

export async function login(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error) return { ok: true as const };

  const message =
    error.message === "Invalid login credentials"
      ? "Email atau password salah."
      : error.message === "Email not confirmed"
        ? "Email belum dikonfirmasi. Cek inbox kamu."
        : error.message;

  return { ok: false as const, message };
}

export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.name, phone: input.phone, role: "customer" },
      emailRedirectTo: `${window.location.origin}/callback`,
    },
  });

  if (error) {
    return {
      ok: false as const,
      message: error.message.includes("already registered")
        ? "Email sudah terdaftar."
        : error.message,
    };
  }

  // Kalau "Confirm email" OFF, signUp langsung bikin session.
  // Logout dulu supaya alurnya sesuai desain FE: daftar → halaman login.
  if (data.session) await supabase.auth.signOut();

  return { ok: true as const };
}

export async function logout() {
  await createClient().auth.signOut();
}
