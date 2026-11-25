import { test as base, Page } from "@playwright/test";

export type RoleType = "admin" | "pengawas" | "mandor";

export async function setDemoSession(page: Page, role: RoleType) {
  await page.addInitScript((roleName) => {
    window.sessionStorage.setItem("way2home-demo-role", roleName);
  }, role);
}

export async function clearDemoSession(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.removeItem("way2home-demo-role");
  });
}

export async function loginViaForm(page: Page, email: string, pass: string) {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await page.fill("#email", email);
  await page.fill("#password", pass);
  await page.click('button[type="submit"]');
}

export async function mockMidtransGateway(page: Page) {
  await page.route("https://app.sandbox.midtrans.com/snap/snap.js*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        window.snap = {
          pay: function(token, options) {
            console.log("Mock Snap Pay triggered with token:", token);
            if (options && typeof options.onSuccess === "function") {
              setTimeout(() => {
                options.onSuccess({
                  transaction_id: "mock-trx-12345",
                  status_code: "200",
                  gross_amount: "50000000.00",
                  payment_type: "bank_transfer",
                  transaction_status: "settlement"
                });
              }, 300);
            }
          }
        };
      `,
    });
  });
}

export const test = base.extend<{
  authPage: {
    loginAs: (role: RoleType) => Promise<void>;
    loginViaForm: (email: string, pass: string) => Promise<void>;
  };
}>({
  authPage: async ({ page }, provide) => {
    await provide({
      loginAs: async (role: RoleType) => {
        await setDemoSession(page, role);
      },
      loginViaForm: async (email: string, pass: string) => {
        await loginViaForm(page, email, pass);
      },
    });
  },
});

export { expect } from "@playwright/test";
