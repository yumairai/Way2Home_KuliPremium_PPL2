import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Konfigurasi Supabase admin belum tersedia.");
  }

  if (!serviceRoleKey.startsWith("sb_secret_")) {
    try {
      const payloadPart = serviceRoleKey.split(".")[1];
      const normalized = payloadPart
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
      const payload = JSON.parse(
        Buffer.from(normalized, "base64").toString("utf8"),
      ) as { role?: string };

      if (payload.role !== "service_role") {
        throw new Error(
          "SUPABASE_SERVICE_ROLE_KEY harus memakai kunci service role, bukan anon/publishable key.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("SUPABASE_SERVICE_ROLE_KEY")) {
        throw error;
      }
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY bukan kunci legacy yang valid atau kunci rahasia Supabase.",
      );
    }
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
