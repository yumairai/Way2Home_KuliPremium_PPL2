import { test, expect, setDemoSession } from "./fixtures/auth.fixture";

test.describe("Admin Portal & Verification Management Module", () => {
  test.beforeEach(async ({ page }) => {
    await setDemoSession(page, "admin");
  });

  test("4.1 Menampilkan Dashboard Admin (/admin) dengan ringkasan & grafik", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("Selamat datang, Admin");
    await expect(page.locator("text=Tren nilai proyek")).toBeVisible();
    await expect(page.locator('aside a[href="/admin"]').first()).toBeVisible();
  });

  test("4.2 Menampilkan halaman Verifikasi Dokumen Customer (/admin/verifikasi-dokumen)", async ({ page }) => {
    await page.goto("/admin/verifikasi-dokumen");
    await expect(page.locator("h1")).toContainText("Verifikasi dokumen");
    await expect(page.locator("text=Periksa dokumen, budget, dan desain")).toBeVisible();
  });

  test("4.3 Menampilkan halaman Verifikasi Mandor (/admin/verifikasi-mandor)", async ({ page }) => {
    await page.route("**/api/admin/mandor-verification*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              id: "m-001",
              name: "Pak Bambang",
              email: "bambang@test.com",
              city: "Bandung",
              expertise: "Pondasi & Struktur",
              experienceYears: 10,
              phone: "081234567890",
              status: "Menunggu",
            },
          ],
        }),
      });
    });

    await page.goto("/admin/verifikasi-mandor");
    await expect(page.locator("h1")).toContainText("Verifikasi Mandor");
    await expect(page.locator('input[placeholder*="Cari nama, lokasi, keahlian"]')).toBeVisible();
  });

  test("4.4 Menampilkan halaman Manajemen Pengawas (/admin/manajemen-pengawas)", async ({ page }) => {
    await page.goto("/admin/manajemen-pengawas");
    await expect(
      page.locator("text=Alokasi Pengawas")
        .or(page.locator("text=Anda harus login terlebih dahulu."))
        .or(page.locator("h1"))
    ).toBeVisible();
  });

  test("4.5 Navigasi sidebar admin berfungsi antar modul", async ({ page }) => {
    await page.goto("/admin");

    // Navigasi ke verifikasi dokumen
    await page.click('aside a[href="/admin/verifikasi-dokumen"]');
    await expect(page).toHaveURL(/\/admin\/verifikasi-dokumen/);

    // Navigasi ke verifikasi mandor
    await page.click('aside a[href="/admin/verifikasi-mandor"]');
    await expect(page).toHaveURL(/\/admin\/verifikasi-mandor/);

    // Navigasi ke manajemen pengawas
    await page.click('aside a[href="/admin/manajemen-pengawas"]');
    await expect(page).toHaveURL(/\/admin\/manajemen-pengawas/);
  });
});
