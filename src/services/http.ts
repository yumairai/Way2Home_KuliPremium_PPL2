import { NextResponse } from "next/server";
import { ServiceError } from "./access.service";

/**
 * Pembungkus error standar untuk seluruh Route Handler.
 * Error layanan dikirim apa adanya (status + pesan), error tak terduga
 * dipadamkan agar detail internal tidak bocor ke client.
 */
export function jsonError(error: unknown, context: string, fallback: string) {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }

  console.error(`Error in ${context}:`, error);
  return NextResponse.json({ message: fallback }, { status: 500 });
}

/** Baca body JSON tanpa memaksa caller menangani parse error. */
export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
