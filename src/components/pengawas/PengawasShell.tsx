"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth.service";
import { useAuthUser } from "@/hooks/useAuthUser";
import { clearDemoRole, useDemoRole } from "@/utils/demo-auth";

export default function PengawasShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthUser();
  const demoRole = useDemoRole();
  const [drawer, setDrawer] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    if (demoRole) {
      if (demoRole !== "pengawas")
        router.replace(demoRole === "admin" ? "/admin" : "/mandor");
      return;
    }
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && user.role !== "pengawas")
      router.replace("/dashboard");
  }, [demoRole, loading, user, router]);
  const onLogout = async () => {
    setLoggingOut(true);
    if (demoRole) clearDemoRole();
    else await logout();
    router.replace("/login");
    router.refresh();
  };
  if (!demoRole && (loading || !user || user.role !== "pengawas"))
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f6fa] text-sm text-slate-600">
        Memuat halaman...
      </main>
    );
  const nav = (
    <aside className="flex h-full flex-col bg-[#10283d] text-white">
      <Link
        href="/pengawas"
        className="flex h-[82px] items-center gap-3 border-b border-white/10 px-7"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#b6dc67] text-lg font-black text-[#10283d]">
          W
        </span>
        <span>
          <b className="block text-[17px] tracking-tight">Way2Home</b>
          <small className="text-[10px] font-semibold tracking-[.16em] text-slate-400">
            PANEL PENGAWAS
          </small>
        </span>
      </Link>
      <div className="px-5 pt-7">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
          Navigasi
        </p>
        <nav className="mt-3 space-y-1" aria-label="Navigasi Pengawas">
          <Link
            href="/pengawas"
            aria-current={pathname === "/pengawas" ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm ${pathname === "/pengawas" ? "border border-white/10 bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/[.06]"}`}
          >
            Dashboard
          </Link>
          <Link
            href="/pengawas#proyek"
            aria-current={
              pathname.startsWith("/pengawas/proyek") ? "page" : undefined
            }
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm ${pathname.startsWith("/pengawas/proyek") ? "border border-white/10 bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/[.06]"}`}
          >
            Proyek
          </Link>
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-xl bg-white/[.06] p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d6e5f2] text-xs font-bold text-[#17344e]">
            {demoRole ? "PW" : user?.fullName?.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-xs">
              {demoRole ? "Rizky Ramadhan" : user?.fullName}
            </b>
            <small className="text-[10px] text-slate-400">Pengawas</small>
          </span>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            aria-label="Keluar"
            className="text-xs text-slate-400 hover:text-white"
          >
            ↗
          </button>
        </div>
      </div>
    </aside>
  );
  return (
    <div className="min-h-screen bg-[#f3f6fa] text-[#183047]">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[252px] lg:block">
        {nav}
      </div>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-[#091827]/55"
            onClick={() => setDrawer(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85vw]">{nav}</div>
        </div>
      )}
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#e6ebf1] bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setDrawer(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden"
            >
              ☰
            </button>
            <div>
              <p className="text-[11px] text-slate-500">Way2Home / Pengawas</p>
              <p className="text-sm font-semibold">
                {pathname.startsWith("/pengawas/proyek")
                  ? "Detail proyek"
                  : "Ringkasan pekerjaan"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:block">
              {demoRole ? "Rizky Ramadhan" : user?.fullName}
            </span>
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="text-xs font-semibold text-slate-600 hover:text-[#164d7b]"
            >
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
