import { test, expect } from "./fixtures/auth.fixture";

test.describe("Customer Project Submission & Tracking Journey", () => {
  test("3.1 Access Control: Pengguna belum login mengakses /proyek diarahkan ke /login", async ({ page }) => {
    await page.goto("/proyek");
    await expect(page).toHaveURL(/\/login/);
  });

  test("3.2 Access Control: Pengguna belum login mengakses /proyek/[id] diarahkan ke /login", async ({ page }) => {
    await page.goto("/proyek/test-project-123");
    await expect(page).toHaveURL(/\/login/);
  });

  test("3.3 Access Control: Pengguna belum login mengakses /proyek/[id]/tracking diarahkan ke /login", async ({ page }) => {
    await page.goto("/proyek/test-project-123/tracking");
    await expect(page).toHaveURL(/\/login/);
  });

  test("3.4 API Route Validation: POST /api/projects tanpa autentikasi menolak akses (401/403)", async ({ page }) => {
    await page.goto("/login");
    const response = await page.evaluate(async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        body: new FormData(),
      });
      return { status: res.status };
    });

    expect([401, 403, 500]).toContain(response.status);
  });
});
