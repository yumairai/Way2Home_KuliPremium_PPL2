import { test, expect } from "./fixtures/auth.fixture";

const MOCK_DESIGNS = [
  {
    id: "des-01",
    slug: "modern-minimalis",
    name: "Rumah Modern Minimalis",
    style: "Modern",
    location: "Bandung",
    landArea: 120,
    buildingArea: 90,
    estimatedCost: 750000000,
    estimatedDuration: 6,
    image: "/images/katalog/modern-1.jpg",
    bedrooms: 3,
    bathrooms: 2,
    description: "Desain rumah modern minimalis cocok untuk keluarga muda.",
  },
  {
    id: "des-02",
    slug: "scandinavian-warmth",
    name: "Scandinavian Warmth",
    style: "Skandinavia",
    location: "Bandung",
    landArea: 140,
    buildingArea: 100,
    estimatedCost: 850000000,
    estimatedDuration: 7,
    image: "/images/katalog/scandi-1.jpg",
    bedrooms: 3,
    bathrooms: 2,
    description: "Desain rumah Skandinavia dengan pencahayaan alami melimpah.",
  },
];

test.describe("Catalog & AI Design Recommendation Module", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/designs*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DESIGNS),
      });
    });
  });

  test("2.1 Menampilkan katalog rumah dengan header, input pencarian, dan filter", async ({ page }) => {
    await page.goto("/katalog");
    await expect(page.locator("h1")).toContainText("Temukan rumah");
    await expect(page.locator("#catalog-search")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Filter desain" })).toBeVisible();
  });

  test("2.2 Pencarian katalog: filter kata kunci 'Modern' menyaring hasil", async ({ page }) => {
    await page.goto("/katalog");
    const searchInput = page.locator("#catalog-search");
    await searchInput.fill("Modern");

    await expect(page.locator("text=desain rumah").first()).toBeVisible();
    await expect(page.locator("text=Rumah Modern Minimalis")).toBeVisible();
  });

  test("2.3 Navigasi ke detail desain katalog: memilih salah satu desain", async ({ page }) => {
    await page.goto("/katalog");
    const firstDesignLink = page.locator('a[href^="/katalog/"]').first();
    await expect(firstDesignLink).toBeVisible();
    await firstDesignLink.click();

    await expect(page).toHaveURL(/\/katalog\/.+/);
  });

  test("2.4 Access Control: Mengakses /ai-planning-based tanpa login diarahkan ke /login", async ({ page }) => {
    await page.goto("/ai-planning-based");
    await expect(page).toHaveURL(/\/login/);
  });
});
