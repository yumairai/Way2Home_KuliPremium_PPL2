"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/auth.service";
import { ROLE_LABEL, useAuthUser } from "@/hooks/useAuthUser";
import { clearDemoRole, useDemoRole, type DemoRole } from "@/utils/demo-auth";

const ROLE_PATH: Record<DemoRole, string> = {
  admin: "/admin",
  mandor: "/mandor",
  pengawas: "/pengawas",
};

export default function RoleDashboard({ role }: { role: DemoRole }) {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const demoRole = useDemoRole();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (demoRole) {
      if (demoRole !== role) router.replace(ROLE_PATH[demoRole]);
      return;
    }
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) router.replace("/dashboard");
  }, [demoRole, loading, role, router, user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    if (demoRole) clearDemoRole();
    else await logout();
    router.replace("/login");
    router.refresh();
  };

  if (!demoRole && (loading || !user || user.role !== role)) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] text-[#475569]">Memuat halaman...</main>;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,_#eaf3ff,_#f7f9fc_55%)] px-6 py-24 text-[#111e3f]">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(17,30,63,0.10)] backdrop-blur md:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eef5ff] text-2xl font-black text-[#045ec2]">{ROLE_LABEL[role].slice(0, 1)}</span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-[#045ec2]">Way2Home · {ROLE_LABEL[role]}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Page {ROLE_LABEL[role]}</h1>
        <p className="mt-4 text-[#64748b]">{demoRole ? "Akun demo aktif." : `Halo, ${user?.fullName}.`} Halaman khusus {ROLE_LABEL[role].toLowerCase()} sedang disiapkan.</p>
        <button type="button" onClick={handleLogout} disabled={loggingOut} className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-7 font-bold text-white shadow-[0_12px_28px_rgba(0,71,150,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">
          {loggingOut ? "Keluar..." : "Logout"}
        </button>
      </section>
    </main>
  );
}
