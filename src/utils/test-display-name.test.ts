import { describe, expect, it } from "vitest";
import { getUserDisplayName } from "./test-display-name";

describe("getUserDisplayName", () => {
  it("uses the friendly label for each external testing account", () => {
    expect(
      getUserDisplayName({
        email: "admin-testing@way2home.test",
        role: "admin",
        isTestUser: true,
        fullName: "Superadmin",
      }),
    ).toBe("Admin Testing");

    for (const role of ["customer", "pengawas", "mandor"] as const) {
      for (const number of [1, 2, 3]) {
        expect(
          getUserDisplayName({
            email: `${role}-testing-${number}@way2home.test`,
            role,
            isTestUser: true,
            fullName: "Test Account",
          }),
        ).toBe(`${role[0].toUpperCase()}${role.slice(1)} Testing ${number}`);
      }
    }
  });

  it("preserves profile names for regular or unrecognized accounts", () => {
    expect(
      getUserDisplayName({
        email: "alice@example.com",
        role: "customer",
        isTestUser: false,
        fullName: "Alice Example",
      }),
    ).toBe("Alice Example");

    expect(
      getUserDisplayName({
        email: "admin-testing@way2home.test",
        role: "admin",
        isTestUser: false,
        fullName: "Administrator",
      }),
    ).toBe("Administrator");
  });
});
