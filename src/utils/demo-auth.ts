import { useSyncExternalStore } from "react";

export type DemoRole = "admin" | "mandor" | "pengawas";

const DEMO_ACCOUNTS: Record<DemoRole, { email: string; password: string }> = {
  admin: { email: "admin@way2home.test", password: "admin123" },
  mandor: { email: "mandor@way2home.test", password: "mandor123" },
  pengawas: { email: "pengawas@way2home.test", password: "pengawas123" },
};
const EVENT_NAME = "way2home-demo-role-change";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

function snapshot(): DemoRole | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem("way2home-demo-role");
  return value === "admin" || value === "mandor" || value === "pengawas" ? value : null;
}

export function useDemoRole() {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export function authenticateDemoAccount(email: string, password: string): DemoRole | null {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = Object.entries(DEMO_ACCOUNTS).find(
    ([, account]) => account.email === normalizedEmail && account.password === password,
  );
  return (entry?.[0] as DemoRole | undefined) ?? null;
}

export function setDemoRole(role: DemoRole) {
  window.sessionStorage.setItem("way2home-demo-role", role);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function clearDemoRole() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("way2home-demo-role");
  window.dispatchEvent(new Event(EVENT_NAME));
}
