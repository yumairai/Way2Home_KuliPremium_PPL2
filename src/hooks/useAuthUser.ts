"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type UserRole = "customer" | "admin" | "pengawas" | "mandor";

export type AuthUser = {
  id: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
} | null;

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: "Customer",
  admin: "Admin",
  pengawas: "Pengawas",
  mandor: "Mandor",
};

const VALID_ROLES: UserRole[] = ["customer", "admin", "pengawas", "mandor"];
function toRole(v: unknown): UserRole {
  return VALID_ROLES.includes(v as UserRole) ? (v as UserRole) : "customer";
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const load = async (sessionUser?: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    }) => {
      if (!sessionUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { id, user_metadata } = sessionUser;

      // Coba ambil dari tabel profiles dulu
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, avatar_url")
        .eq("id", id)
        .single();

      if (!active) return;

      if (profile) {
        const { data: avatar } = profile.avatar_url
          ? await supabase.storage
              .from("avatars")
              .createSignedUrl(profile.avatar_url, 3600)
          : { data: null };

        if (!active) return;

        // Profil ditemukan di tabel profiles
        setUser({
          id,
          fullName: profile.full_name ?? "User",
          role: toRole(profile.role),
          avatarUrl: avatar?.signedUrl ?? null,
        });
      } else {
        // Fallback: gunakan user_metadata dari JWT Supabase
        const fallbackName =
          (user_metadata?.full_name as string) ||
          (user_metadata?.name as string) ||
          sessionUser.email?.split("@")[0] ||
          "User";
        const fallbackRole = toRole(user_metadata?.role);
        setUser({
          id,
          fullName: fallbackName,
          role: fallbackRole,
          avatarUrl: null,
        });
      }
      setLoading(false);
    };

    const handleProfileUpdated = (event: Event) => {
      const { fullName, avatarUrl } = (
        event as CustomEvent<{ fullName: string; avatarUrl: string | null }>
      ).detail;
      setUser((current) =>
        current ? { ...current, fullName, avatarUrl } : current,
      );
    };

    window.addEventListener("w2h:profile-updated", handleProfileUpdated);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) load(session?.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) load(session?.user);
    });

    return () => {
      active = false;
      window.removeEventListener("w2h:profile-updated", handleProfileUpdated);
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
