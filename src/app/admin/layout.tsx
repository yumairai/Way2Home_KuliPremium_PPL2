"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/services/auth.service";
import { useAuthUser } from "@/hooks/useAuthUser";
import { clearDemoRole, useDemoRole } from "@/utils/demo-auth";

const navigation = [
  { label: "Dashboard", href: "/admin" },
  {
    label: "Verifikasi dokumen",
    href: "/admin/verifikasi-dokumen",
    badge: "12",
  },
  { label: "Verifikasi Mandor", href: "/admin/verifikasi-mandor", badge: "4" },
  { label: "Manajemen Pengawas", href: "/admin/manajemen-pengawas" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthUser();
  const demoRole = useDemoRole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    if (demoRole) {
      if (demoRole !== "admin")
        router.replace(demoRole === "mandor" ? "/mandor" : "/pengawas");
      return;
    }
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && user.role !== "admin")
      router.replace("/dashboard");
  }, [demoRole, loading, user, router]);
  const onLogout = async () => {
    setLoggingOut(true);
    if (demoRole) clearDemoRole();
    else await logout();
    router.replace("/login");
    router.refresh();
  };
  if (!demoRole && (loading || !user || user.role !== "admin"))
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f6fa] text-slate-600">
        Memuat halaman...
      </main>
    );
  const sidebar = (
    <aside className="flex h-full flex-col bg-[#10283d] text-white">
      <Link
        href="/admin"
        className="flex h-[82px] items-center gap-3 border-b border-white/10 px-7"
        aria-label="Way2Home Admin dashboard"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#b6dc67] text-lg font-black text-[#10283d]">
          W
        </span>
        <span>
          <b className="block text-[17px] tracking-tight">Way2Home</b>
          <small className="text-[10px] font-semibold tracking-[.18em] text-slate-400">
            ADMINISTRATION
          </small>
        </span>
      </Link>
      <div className="px-5 pt-7">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
          Menu utama
        </p>
        <nav className="mt-3 space-y-1" aria-label="Navigasi admin">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
                  ? "page"
                  : undefined
              }
              onClick={() => setDrawerOpen(false)}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm ${pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ? "border border-white/10 bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/[.06] hover:text-white"}`}
            >
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-md bg-[#e4a84d]/15 px-2 py-0.5 text-[10px] font-bold text-[#f3c476]">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-xl bg-white/[.06] p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d6e5f2] text-xs font-bold text-[#17344e]">
            AD
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-xs">
              {demoRole ? "Admin Demo" : user?.fullName}
            </b>
            <small className="text-[10px] text-slate-400">Administrator</small>
          </span>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="text-xs text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c2e477]"
            aria-label="Keluar"
          >
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );
  return (
    <div className="min-h-screen bg-[#f3f6fa] text-[#183047]">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[252px] lg:block">
        {sidebar}
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-[#091827]/55"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85vw]">
            {sidebar}
          </div>
        </div>
      )}
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#e6ebf1] bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden"
              aria-label="Buka menu"
              onClick={() => setDrawerOpen(true)}
            >
              ☰
            </button>
            <div>
              <p className="text-[11px] text-slate-500">Way2Home / Admin</p>
              <p className="text-sm font-semibold">Ringkasan operasional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:block">
              Kamis, 15 Oktober 2026
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7eef5] text-xs font-bold">
              {demoRole ? "AD" : user?.fullName?.slice(0, 2).toUpperCase()}
            </span>
            <button
              onClick={onLogout}
              disabled={loggingOut}
              className="hidden text-xs font-semibold text-slate-600 hover:text-[#164d7b] sm:block"
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
