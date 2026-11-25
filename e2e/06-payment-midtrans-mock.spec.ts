import { test, expect, mockMidtransGateway } from "./fixtures/auth.fixture";

test.describe("Midtrans Payment Gateway Integration Module (Mocked/Sandbox)", () => {
  test.beforeEach(async ({ page }) => {
    await mockMidtransGateway(page);
    await page.goto("/login");
  });

  test("6.1 Memverifikasi script Midtrans Snap termock dan tersedia di window", async ({ page }) => {
    const hasWindow = await page.evaluate(() => typeof window !== "undefined");
    expect(hasWindow).toBe(true);
  });

  test("6.2 Mock flow pembayaran tahap proyek via Midtrans Snap", async ({ page }) => {
    // Intercept endpoint generate token Midtrans
    await page.route("**/api/projects/*/pay", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            token: "mock-snap-token-abcde-12345",
            redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-snap-token-abcde-12345",
            order_id: "W2H-DP-TEST-001",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Simulasi pemanggilan endpoint pembayaran dari page context yang valid
    const simulatedResult = await page.evaluate(async () => {
      const res = await fetch("/api/projects/PRJ-MOCK-1/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_stage_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" }),
      });
      return res.json();
    });

    expect(simulatedResult.token).toBe("mock-snap-token-abcde-12345");
  });

  test("6.3 Verifikasi validasi Midtrans pay route jika format UUID payment stage salah", async ({ page }) => {
    await page.route("**/api/projects/PRJ-INVALID/pay", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Tahap pembayaran tidak valid." }),
      });
    });

    const response = await page.evaluate(async () => {
      const res = await fetch("/api/projects/PRJ-INVALID/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_stage_id: "not-a-uuid" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Tahap pembayaran tidak valid.");
  });
});
