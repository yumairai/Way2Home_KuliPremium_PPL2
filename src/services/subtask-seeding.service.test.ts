/**
 * White Box Testing — src/services/subtask-seeding.service.ts
 *
 * Fungsi yang diuji:
 * - seedProjectSubtasks
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Idempotency, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedProjectSubtasks } from "./subtask-seeding.service";
import { createAdminClient } from "@/utils/supabase/admin";

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));


describe("seedProjectSubtasks — Otomatisasi Seeding 6 Tahap & 24 Subtask", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus keluar secara graceful jika admin client gagal dibuat dan tidak ada fallbackClient", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(seedProjectSubtasks("proj-123")).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[seedProjectSubtasks] Admin client tidak tersedia:"),
      expect.any(Error),
    );
  });

  it("harus menggunakan fallbackClient jika admin client gagal dibuat", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("Admin key not found");
    });

    const mockFallbackClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_stages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "stage-new-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_subtasks") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    } as any;

    await expect(seedProjectSubtasks("proj-123", mockFallbackClient)).resolves.toBeUndefined();
    expect(mockFallbackClient.from).toHaveBeenCalledWith("project_stages");
  });

  it("harus idempoten: jika tahap dan subtask sudah ada, tidak melakukan insert ulang", async () => {
    const existingStages = [
      { id: "stage-1", urutan: 1 },
      { id: "stage-2", urutan: 2 },
      { id: "stage-3", urutan: 3 },
      { id: "stage-4", urutan: 4 },
      { id: "stage-5", urutan: 5 },
      { id: "stage-6", urutan: 6 },
    ];

    const stagesInsertSpy = vi.fn();
    const subtasksInsertSpy = vi.fn();

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_stages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: existingStages,
                error: null,
              }),
            }),
            insert: stagesInsertSpy,
          };
        }
        if (table === "project_subtasks") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                // Simulasi semua subtask sudah ada (urutan 1..5)
                data: [1, 2, 3, 4, 5].map((u) => ({ urutan: u })),
                error: null,
              }),
            }),
            insert: subtasksInsertSpy,
          };
        }
        return {};
      }),
    } as any;

    vi.mocked(createAdminClient).mockReturnValue(mockClient);

    await seedProjectSubtasks("proj-123");

    // Pastikan tidak ada insert tahap baru maupun subtask baru
    expect(stagesInsertSpy).not.toHaveBeenCalled();
    expect(subtasksInsertSpy).not.toHaveBeenCalled();
  });

  it("harus menangani checkError pada pemeriksaan tahap awal dengan warning tanpa melempar throw", async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("permission denied for table project_stages"),
          }),
        }),
      }),
    } as any;

    vi.mocked(createAdminClient).mockReturnValue(mockClient);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(seedProjectSubtasks("proj-denied")).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[seedProjectSubtasks] Gagal cek stage proyek"),
      "permission denied for table project_stages",
    );
  });
});
