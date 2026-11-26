import type { UserRole } from "@/hooks/useAuthUser";

type TestAccountIdentity = {
  email: string;
  role: UserRole;
  isTestUser: boolean;
};

type DisplayIdentity = TestAccountIdentity & { fullName: string };

const ROLE_NAMES: Record<UserRole, string> = {
  customer: "Customer",
  admin: "Admin",
  pengawas: "Pengawas",
  mandor: "Mandor",
};

export function getUserDisplayName(user: DisplayIdentity): string {
  if (!user.isTestUser) return user.fullName;

  const email = user.email.trim().toLowerCase();
  if (user.role === "admin" && email === "admin-testing@way2home.test") {
    return "Admin Testing";
  }

  const match =
    /^(customer|pengawas|mandor)-testing-([1-3])@way2home\.test$/.exec(email);
  if (!match || match[1] !== user.role) return user.fullName;

  return `${ROLE_NAMES[user.role]} Testing ${match[2]}`;
}
