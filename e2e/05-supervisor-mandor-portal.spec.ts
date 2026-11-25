import { test, expect, setDemoSession } from "./fixtures/auth.fixture";

test.describe("Supervisor and Mandor Field Portals Module", () => {
  test.describe("Supervisor Portal (/pengawas)", () => {
    test.beforeEach(async ({ page }) => {
      await setDemoSession(page, "pengawas");
    });

    test("5.1 Menampilkan dashboard pengawas dengan panel navigasi", async ({ page }) => {
      await page.goto("/pengawas");
      await expect(page.locator("text=PANEL PENGAWAS")).toBeVisible();
      await expect(page.locator('aside a[href="/pengawas"]').first()).toBeVisible();
    });

    test("5.2 Menampilkan navigasi sidebar pengawas", async ({ page }) => {
      await page.goto("/pengawas");
      await expect(page.locator("text=PANEL PENGAWAS")).toBeVisible();
      await expect(page.locator('aside a[href="/pengawas"]').first()).toBeVisible();
    });
  });

  test.describe("Mandor Portal (/mandor)", () => {
    test.beforeEach(async ({ page }) => {
      await setDemoSession(page, "mandor");
    });

    test("5.3 Menampilkan dashboard mandor dengan metrik pekerjaan", async ({ page }) => {
      await page.route("**/api/mandor/registration*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "Disetujui", reason: null }),
        });
      });

      await page.route("**/api/mandor/projects", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.goto("/mandor");
      await expect(page.locator("text=PANEL MANDOR")).toBeVisible();
      await expect(page.locator("h1")).toContainText("Pekerjaan Anda");
      await expect(page.locator("text=Proyek aktif")).toBeVisible();
    });

    test("5.4 Navigasi ke panel mandor (/mandor/proyek)", async ({ page }) => {
      await page.route("**/api/mandor/registration*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "Disetujui", reason: null }),
        });
      });

      await page.route("**/api/mandor/projects*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.goto("/mandor/proyek");
      await expect(page.locator("text=PANEL MANDOR")).toBeVisible();
    });

    test("5.5 Menampilkan detail proyek mandor dan interaksi tab", async ({ page }) => {
      await page.route("**/api/mandor/registration*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "Disetujui", reason: null }),
        });
      });

      await page.route("**/api/mandor/projects/PRJ-MOCK-1*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "PRJ-MOCK-1",
            status: "berjalan",
            title: "Proyek Modern Minimalis",
            design: "Rumah Modern",
            location: "Bandung",
            assignedAt: "2026-10-01",
            target: "2026-12-31",
            overallProgress: 35,
            currentMilestone: "Pondasi & Struktur",
            supervisor: "Pak Pengawas",
            supervisorNote: "Lanjutkan pengecoran",
            image: "/images/katalog/modern-1.jpg",
            scope: ["Pondasi", "Struktur", "Dinding"],
            milestones: [
              {
                id: "m1",
                title: "Pondasi & Struktur",
                target: "2026-11-15",
                weight: 25,
                subtasks: [{ id: "st-1", title: "Galian tanah", weight: 10, done: true }],
              },
            ],
            progressReports: [],
            issueReports: [],
            notes: [],
          }),
        });
      });

      await page.goto("/mandor/proyek/PRJ-MOCK-1");
      const ringkasanTab = page.locator("text=Ringkasan").first();
      await expect(ringkasanTab).toBeVisible();
    });
  });
});
