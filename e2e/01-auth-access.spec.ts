import { test, expect } from "./fixtures/auth.fixture";
import { TEST_USERS } from "./fixtures/test-data";

test.describe("Authentication and Access Control Module", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => sessionStorage.clear());
  });

  test("1.1 Menampilkan halaman login dengan input dan elemen pendukung", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Selamat Datang");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("1.2 Validasi form login: input kosong memunculkan pesan error", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Email wajib diisi.")).toBeVisible();
    await expect(page.locator("text=Password wajib diisi.")).toBeVisible();
  });

  test("1.3 Validasi form login: format email tidak valid", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "invalid-email-format");
    await page.fill("#password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Format email tidak valid.")).toBeVisible();
  });

  test("1.4 Login berhasil sebagai Admin via akun demo dan diarahkan ke /admin", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", TEST_USERS.admin.email);
    await page.fill("#password", TEST_USERS.admin.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('a[href="/admin"]').first()).toBeVisible();
  });

  test("1.5 Login berhasil sebagai Pengawas via akun demo dan diarahkan ke /pengawas", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", TEST_USERS.pengawas.email);
    await page.fill("#password", TEST_USERS.pengawas.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/pengawas/);
    await expect(page.locator("text=PANEL PENGAWAS")).toBeVisible();
  });

  test("1.6 Login berhasil sebagai Mandor via akun demo dan diarahkan ke /mandor", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", TEST_USERS.mandor.email);
    await page.fill("#password", TEST_USERS.mandor.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/mandor/);
    await expect(page.locator("text=PANEL MANDOR")).toBeVisible();
  });

  test("1.7 Access Control: Pengguna belum login mengakses /admin diarahkan ke /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("1.8 Access Control: Pengguna belum login mengakses /pengawas diarahkan ke /login", async ({ page }) => {
    await page.goto("/pengawas");
    await expect(page).toHaveURL(/\/login/);
  });

  test("1.9 Access Control: Pengguna belum login mengakses /mandor diarahkan ke /login", async ({ page }) => {
    await page.goto("/mandor");
    await expect(page).toHaveURL(/\/login/);
  });

  test("1.10 Registrasi Customer: Validasi form wajib dan konfirmasi kata sandi", async ({ page }) => {
    await page.goto("/register/customer");
    await expect(page.locator("h1")).toContainText("Buat Akun Baru");

    // Centang persetujuan legal agar tombol submit aktif
    await page.check("#legal-consent");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Nama lengkap wajib diisi.")).toBeVisible();
    await expect(page.locator("text=Format alamat email tidak valid.")).toBeVisible();

    // Isi password tidak cocok
    await page.fill("#name", "User Testing");
    await page.fill("#password", "Password123");
    await page.fill("#password_confirmation", "MismatchPass999");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Konfirmasi kata sandi tidak sesuai.")).toBeVisible();
  });
});
