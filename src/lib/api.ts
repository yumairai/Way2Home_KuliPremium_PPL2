/**
 * api.ts — pembungkus fetch untuk Route Handler internal.
 *
 * Komponen client tidak memanggil service Supabase secara langsung;
 * seluruh aksi melewati /api/* sehingga validasi, RLS, dan pesan galat
 * berpusat di sisi server.
 */

type ErrorPayload = { message?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...(init.headers ?? {}) }
      : init?.headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (payload as ErrorPayload | null)?.message ?? "Permintaan gagal diproses.",
    );
  }

  return payload as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

function send<T>(path: string, method: string, body?: unknown) {
  return request<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return send<T>(path, "POST", body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return send<T>(path, "PATCH", body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return send<T>(path, "PUT", body);
}

/** Pesan galat ramah pengguna dari respons API atau objek Error biasa. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
