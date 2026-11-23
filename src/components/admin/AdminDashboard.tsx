"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type {
  AdminDashboardData,
  AdminDashboardProject,
  AdminProjectStatus,
  RevenueTrendPoint,
} from "@/services/admin-dashboard.service";

const statusClasses: Record<AdminProjectStatus, string> = {
  Berjalan: "bg-[#edf4fc] text-[#356794]",
  Menunggu: "bg-[#fbf2e3] text-[#a56a19]",
  Selesai: "bg-[#eaf4eb] text-[#477e53]",
};

function TrendChart({
  trend,
}: {
  trend: {
    points: RevenueTrendPoint[];
    totalValueFormatted: string;
    percentageChangeFormatted: string;
    monthRangeLabel: string;
  };
}) {
  const points = trend.points
    .map((point, index) => `${30 + index * 64},${118 - point.amount}`)
    .join(" ");
  const area = `30,118 ${points} 350,118`;

  return (
    <section
      className="rounded-2xl border border-[#e5eaf0] bg-white p-5 md:p-6"
      aria-labelledby="trend-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="trend-title" className="text-[15px] font-bold">
            Tren nilai proyek
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            6 bulan terakhir · {trend.monthRangeLabel}
          </p>
        </div>
        <span className="rounded-lg bg-[#f1f5f9] px-3 py-2 text-[11px] font-semibold text-slate-600">
          6 bulan
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <strong className="text-[26px] tracking-tight">
          {trend.totalValueFormatted}
        </strong>
        <span className="rounded-md bg-[#e9f3e9] px-2 py-1 text-[10px] font-bold text-[#448157]">
          {trend.percentageChangeFormatted}
        </span>
      </div>
      <div className="mt-3 overflow-hidden">
        <svg
          viewBox="0 0 380 145"
          role="img"
          aria-label="Grafik tren nilai proyek selama enam bulan"
          className="h-[150px] w-full overflow-visible"
        >
          <defs>
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#5588b3" stopOpacity=".2" />
              <stop offset="1" stopColor="#5588b3" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${area} Z`} fill="url(#trendFill)" />
          <polyline
            points={points}
            fill="none"
            stroke="#477ba6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {trend.points.map((p, i) => (
            <circle
              key={p.month}
              cx={30 + i * 64}
              cy={118 - p.amount}
              r="3.5"
              fill="#fff"
              stroke="#477ba6"
              strokeWidth="2"
            />
          ))}
          <line x1="25" y1="118" x2="355" y2="118" stroke="#e8edf2" />
        </svg>
        <div className="flex justify-between px-2 text-[10px] text-slate-400">
          {trend.points.map((p) => (
            <span key={p.month}>{p.month}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectTable({ projects }: { projects: AdminDashboardProject[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua status");

  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          `${project.id} ${project.name} ${project.customer} ${project.foreman} ${project.supervisor}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()) &&
          (status === "Semua status" || project.status === status),
      ),
    [projects, query, status],
  );

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white"
      aria-labelledby="projects-title"
    >
      <div className="flex flex-col gap-4 border-b border-[#edf0f4] p-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="projects-title" className="text-[15px] font-bold">
              Proyek terbaru
            </h2>
            <span className="rounded-full bg-[#f0f3f7] px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {filtered.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Daftar proyek aktif dan perkembangan konstruksi
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Cari proyek</span>
            <span className="absolute left-3 top-2.5 text-slate-400">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari proyek atau nama..."
              className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15 sm:w-[220px]"
            />
          </label>
          <label>
            <span className="sr-only">Filter status proyek</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs text-slate-600 outline-none focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15 sm:w-[145px]"
            >
              <option>Semua status</option>
              <option>Berjalan</option>
              <option>Menunggu</option>
              <option>Selesai</option>
            </select>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="bg-[#f8fafc] text-[10px] font-semibold text-slate-500">
              <th className="px-6 py-3">Proyek</th>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Mandor</th>
              <th className="px-4 py-3">Pengawas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-6 py-3">Progres</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f4]">
            {filtered.map((project) => (
              <tr
                key={project.rawId}
                className="transition-colors hover:bg-[#fbfcfd]"
              >
                <td className="px-6 py-4">
                  <span className="block font-semibold text-[#263d53]">
                    {project.name}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {project.id} · {project.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">{project.customer}</td>
                <td className="px-4 py-4 text-slate-600">{project.foreman}</td>
                <td className="px-4 py-4 text-slate-600">
                  {project.supervisor}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[project.status]}`}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {project.progress === null ? (
                    <span className="text-slate-400">Belum diperbarui</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-[74px] overflow-hidden rounded-full bg-[#e9edf2]">
                        <span
                          className="block h-full rounded-full bg-[#668aa8]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600">
                        {project.progress}%
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  Tidak ada proyek yang cocok. Ubah kata kunci atau filter
                  status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#edf0f4] px-6 py-3 text-[10px] text-slate-400">
        Menampilkan {filtered.length} dari {projects.length} proyek
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok && active) {
          const json = (await res.json()) as AdminDashboardData;
          setData(json);
        }
      } catch (err) {
        console.error("Gagal memuat data dashboard admin:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    // Subscribe to realtime updates for live synchronization
    const supabase = createClient();
    const refresh = () => void loadDashboard();

    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mandor_profiles" },
        refresh,
      )
      .subscribe();

    const interval = window.setInterval(refresh, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:space-y-7 md:p-8 xl:p-10">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold text-[#64809a]">
              {todayFormatted}
            </p>
            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#17344e] md:text-[32px]">
              Selamat datang, Admin
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Memuat data ringkasan proyek Way2Home...
            </p>
          </div>
        </section>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[136px] animate-pulse rounded-2xl border border-[#e5eaf0] bg-white p-5"
            />
          ))}
        </section>
      </div>
    );
  }

  const dashboardData = data || {
    currentDateFormatted: todayFormatted,
    metrics: [
      {
        label: "Total pengguna",
        value: "0",
        detail: "Memuat...",
        icon: "users" as const,
        tone: "blue" as const,
      },
      {
        label: "Proyek aktif",
        value: "0",
        detail: "Memuat...",
        icon: "buildings" as const,
        tone: "navy" as const,
      },
      {
        label: "Verifikasi dokumen",
        value: "0",
        detail: "Perlu ditinjau",
        icon: "files" as const,
        tone: "amber" as const,
      },
      {
        label: "Proyek selesai",
        value: "0",
        detail: "Sepanjang waktu",
        icon: "check" as const,
        tone: "green" as const,
      },
    ],
    activeProjectsCount: 0,
    availableSupervisorsCount: 0,
    availableMandorsCount: 0,
    trend: {
      points: [
        { month: "Mei", amount: 20, rawAmount: 0 },
        { month: "Jun", amount: 20, rawAmount: 0 },
        { month: "Jul", amount: 20, rawAmount: 0 },
        { month: "Agu", amount: 20, rawAmount: 0 },
        { month: "Sep", amount: 20, rawAmount: 0 },
        { month: "Okt", amount: 20, rawAmount: 0 },
      ],
      totalValueFormatted: "Rp 0",
      percentageChangeFormatted: "+0%",
      monthRangeLabel: "-",
    },
    projects: [],
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:space-y-7 md:p-8 xl:p-10">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold text-[#64809a]">
            {dashboardData.currentDateFormatted}
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#17344e] md:text-[32px]">
            Selamat datang, Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantau aktivitas dan perkembangan proyek Way2Home.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardData.metrics.map((metric) => (
          <article
            key={metric.label}
            className="flex min-h-[136px] items-start justify-between rounded-2xl border border-[#e5eaf0] bg-white p-5"
          >
            <div>
              <p className="text-xs font-medium text-slate-500">
                {metric.label}
              </p>
              <p className="mt-3 text-[30px] font-bold tracking-tight text-[#17344e]">
                {metric.value}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">{metric.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
        <section className="rounded-2xl bg-[#183b57] p-6 text-white md:p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#b9d0e1]">Ringkasan proyek aktif</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                {dashboardData.activeProjectsCount}{" "}
                <span className="text-base font-medium text-[#bdd0df]">
                  proyek
                </span>
              </h2>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[.06] p-3">
              <span className="text-[10px] text-[#b9d0e1]">
                Pengawas Tersedia
              </span>
              <strong className="mt-1 block text-lg">
                {dashboardData.availableSupervisorsCount}
              </strong>
            </div>
            <div className="col-span-2 rounded-xl border border-white/10 bg-white/[.06] p-3 sm:col-span-1">
              <span className="text-[10px] text-[#b9d0e1]">
                Mandor Tersedia
              </span>
              <strong className="mt-1 block text-lg">
                {dashboardData.availableMandorsCount}
              </strong>
            </div>
          </div>
        </section>
        <TrendChart trend={dashboardData.trend} />
      </div>

      <ProjectTable projects={dashboardData.projects} />

      <footer className="flex flex-col gap-1 border-t border-[#e2e8ee] pt-4 text-[10px] text-slate-400 sm:flex-row sm:justify-between">
        <span>Way2Home · Panel administrasi</span>
        <span>Data diperbarui otomatis dari database.</span>
      </footer>
    </div>
  );
}
