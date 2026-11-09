"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout as logoutUser } from "@/services/auth.service";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthUser } from "@/hooks/useAuthUser";
import { clearDemoRole, useDemoRole } from "@/utils/demo-auth";
import {
  initialMandorRegistration,
  type MandorRegistrationStatus,
} from "@/data/mandor";

type RegistrationStatus = {
  status: MandorRegistrationStatus;
  reason: string | null;
};

/**
 * Status verifikasi pendaftaran mandor, dibaca langsung dari
 * `mandor_profiles.status` + `mandor_profiles.catatan_verifikasi`.
 *
 * `resubmit()` mengajukan ulang pendaftaran (status kembali ke pending).
 */
export function useMandorStatus() {
  const [status, setStatus] = useState<MandorRegistrationStatus>("Menunggu");
  const [reason, setReason] = useState<string>(
    initialMandorRegistration.rejectionReason,
  );
  const [loading, setLoading] = useState(true);

  const resubmit = useCallback(async () => {
    try {
      const result = await apiPost<{ status: MandorRegistrationStatus }>(
        "/api/mandor/registration",
      );
      setStatus(result.status);
      setReason(initialMandorRegistration.rejectionReason);
    } catch (error) {
      console.error("[useMandorStatus] resubmit:", error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    apiGet<RegistrationStatus>("/api/mandor/registration")
      .then((result) => {
        if (!active) return;
        setStatus(result.status);
        setReason(
          result.reason ?? initialMandorRegistration.rejectionReason,
        );
      })
      .catch((error) => {
        if (!active) return;
        console.error("[useMandorStatus]", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { status, reason, loading, resubmit };
}

export default function MandorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthUser();
  const demoRole = useDemoRole();
  const { status } = useMandorStatus();
  const [drawer, setDrawer] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (demoRole) {
      if (demoRole !== "mandor")
        router.replace(demoRole === "admin" ? "/admin" : "/pengawas");
      return;
    }
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && user.role !== "mandor")
      router.replace("/dashboard");
  }, [demoRole, loading, user, router]);
  const logout = async () => {
    setLeaving(true);
    if (demoRole) clearDemoRole();
    else await logoutUser();
    router.replace("/login");
    router.refresh();
  };
  if (!demoRole && (loading || !user || user.role !== "mandor"))
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f6fa] text-sm text-slate-600">
        Memuat halaman...
      </main>
    );
  const navigation = (
    <aside className="flex h-full flex-col bg-[#10283d] text-white">
      <Link
        href="/mandor"
        onClick={() => setDrawer(false)}
        className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
          <Image
            src="/images/logo-w2h.png"
            alt="Logo Way2Home"
            width={40}
            height={40}
            className="h-full w-full object-contain"
            priority
          />
        </span>
        <span>
          <b className="block text-[17px] tracking-tight">Way2Home</b>
          <small className="text-[10px] font-semibold tracking-[.14em] text-slate-400">
            PANEL MANDOR
          </small>
        </span>
      </Link>
      <div className="px-4 pt-6">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
          Navigasi
        </p>
        <nav className="mt-3 space-y-1" aria-label="Navigasi mandor">
          <Link
            href="/mandor"
            onClick={() => setDrawer(false)}
            aria-current={pathname === "/mandor" ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm ${pathname === "/mandor" ? "border border-white/10 bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/[.06]"}`}
          >
            Ringkasan
          </Link>
          <Link
            href="/mandor/proyek"
            onClick={() => setDrawer(false)}
            aria-current={
              pathname.startsWith("/mandor/proyek") ? "page" : undefined
            }
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm ${pathname.startsWith("/mandor/proyek") ? "border border-white/10 bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/[.06]"}`}
          >
            Proyek
            <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[10px]">
              {status === "Disetujui" ? "2" : "0"}
            </span>
          </Link>
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[.06] p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d6e5f2] text-xs font-bold text-[#17344e]">
            BS
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-xs">Bima Saputra</b>
            <small className="text-[10px] text-slate-400">Mandor</small>
          </span>
        </div>
      </div>
    </aside>
  );
  return (
    <div className="mandor-interactions min-h-screen bg-[#f3f6fa] text-[#183047]">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[252px] lg:block">
        {navigation}
      </div>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#091827]/55"
            aria-label="Tutup menu"
            onClick={() => setDrawer(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85vw]">
            {navigation}
          </div>
        </div>
      )}
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e6ebf1] bg-white/95 px-4 backdrop-blur sm:px-6">
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
              <p className="text-[10px] text-slate-500">Way2Home / Mandor</p>
              <p className="text-sm font-semibold">
                {pathname.startsWith("/mandor/proyek")
                  ? "Detail pekerjaan"
                  : "Ruang kerja"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status === "Disetujui" ? "bg-[#edf6ef] text-[#4d7d56]" : status === "Ditolak" ? "bg-[#fff0f0] text-[#a75252]" : "bg-[#fff4e2] text-[#98651e]"}`}
            >
              {status === "Disetujui"
                ? "Terverifikasi"
                : status === "Ditolak"
                  ? "Perlu perbaikan"
                  : "Menunggu verifikasi"}
            </span>
            <button
              type="button"
              onClick={logout}
              disabled={leaving}
              className="rounded-lg border border-[#d99a9a] bg-[#a94444] px-3 py-2 text-xs font-semibold text-white hover:bg-[#913838] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Logout"
            >
              {leaving ? "Logout..." : "Logout"}
            </button>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
