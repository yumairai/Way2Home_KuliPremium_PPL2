"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  assignPengawasToProject,
  canAllocateStaff,
  getActivePengawas,
  getProjectsForAdmin,
  type PengawasOption,
  type ProjectForAdmin,
} from "@/services/allocation.service";
import { ServiceError } from "@/services/access.service";

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  verifikasi_dokumen: "Verif. Dokumen",
  revisi_dokumen: "Revisi Dokumen",
  alokasi_mandor_pengawas: "Menunggu Tim",
  finalisasi_kontrak: "Finalisasi Kontrak",
  pembayaran_dp: "Pembayaran DP",
  berjalan: "Berjalan",
  selesai: "Selesai",
  batal: "Dibatalkan",
  menunggu_pengawas: "Menunggu Pengawas",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  verifikasi_dokumen: "bg-amber-50 text-amber-700",
  revisi_dokumen: "bg-red-50 text-red-700",
  alokasi_mandor_pengawas: "bg-sky-50 text-sky-700",
  finalisasi_kontrak: "bg-purple-50 text-purple-700",
  pembayaran_dp: "bg-orange-50 text-orange-700",
  berjalan: "bg-emerald-50 text-emerald-700",
  selesai: "bg-green-50 text-green-700",
  batal: "bg-red-100 text-red-700",
  menunggu_pengawas: "bg-amber-50 text-amber-700",
};

// ─── Modal: Pilih Pengawas ─────────────────────────────────────────────────────

function AssignPengawasModal({
  project,
  pengawasList,
  onClose,
  onAssigned,
}: {
  project: ProjectForAdmin;
  pengawasList: PengawasOption[];
  onClose: () => void;
  onAssigned: (projectId: string, pengawasId: string, pengawasName: string) => void;
}) {
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      await assignPengawasToProject(supabase, project.id, selected);
      const chosenPengawas = pengawasList.find((p) => p.id === selected);
      onAssigned(project.id, selected, chosenPengawas?.full_name ?? selected);
      onClose();
    } catch (err) {
      if (err instanceof ServiceError) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#0c1b2b]/60 p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-pengawas-title"
        className="w-full max-w-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#e8edf1] px-6 py-5">
          <div>
            <p className="text-[10px] text-slate-500">Alokasi Pengawas</p>
            <h2
              id="assign-pengawas-title"
              className="mt-1 text-lg font-bold text-[#17344e]"
            >
              Pilih Pengawas untuk Proyek
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[480px]">
              {project.design_name} &middot; {project.customer_name}
              {project.alamat_proyek ? ` · ${project.alamat_proyek}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-xl text-slate-500 hover:bg-slate-50"
          >
            ×
          </button>
        </header>

        {error && (
          <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="max-h-[55vh] space-y-2 overflow-y-auto p-5">
          {pengawasList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d9e1e8] p-9 text-center">
              <p className="text-sm font-semibold text-[#365873]">
                Tidak ada pengawas aktif
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tambahkan akun pengawas terlebih dahulu.
              </p>
            </div>
          ) : (
            pengawasList.map((pengawas) => (
              <button
                key={pengawas.id}
                disabled={!pengawas.available}
                onClick={() => setSelected(pengawas.id)}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  !pengawas.available
                    ? "cursor-not-allowed border-[#e7ebef] bg-slate-50 opacity-60"
                    : selected === pengawas.id
                      ? "border-[#7395b1] bg-[#f0f5f8] ring-2 ring-[#7395b1]/15"
                      : "border-[#e7ebef] hover:bg-slate-50"
                }`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#d8e3eb] bg-[#eaf1f6] text-sm font-bold text-[#355973]">
                  {pengawas.full_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm text-[#29465e]">
                    {pengawas.full_name}
                  </b>
                  {pengawas.spesialisasi && (
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {pengawas.spesialisasi}
                    </span>
                  )}
                  {pengawas.phone && (
                    <span className="block text-[10px] text-slate-400">
                      {pengawas.phone}
                    </span>
                  )}
                  {!pengawas.available && (
                    <span className="mt-1 block text-[10px] font-semibold text-amber-700">
                      Sedang menangani proyek aktif
                    </span>
                  )}
                </span>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    selected === pengawas.id
                      ? "border-[#477ba6] bg-[#477ba6] text-white"
                      : "border-slate-300"
                  }`}
                >
                  {selected === pengawas.id ? "✓" : ""}
                </span>
              </button>
            ))
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#e8edf1] bg-[#fafbfc] px-5 py-4">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-[#dfe6ed] px-4 text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Batal
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || submitting}
            className="h-10 rounded-lg bg-[#183b57] px-5 text-xs font-semibold text-white hover:bg-[#234f70] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Mengalokasikan..." : "Alokasikan Pengawas"}
          </button>
        </footer>
      </section>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function SupervisorManagement() {
  const [projects, setProjects] = useState<ProjectForAdmin[]>([]);
  const [pengawasList, setPengawasList] = useState<PengawasOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [allocationFilter, setAllocationFilter] = useState("Semua");
  const [selectedProject, setSelectedProject] = useState<ProjectForAdmin | null>(null);
  const [notice, setNotice] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    return Promise.all([
      getProjectsForAdmin(supabase),
      getActivePengawas(supabase),
    ]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsData, pengawasData] = await fetchData();
      setProjects(projectsData);
      setPengawasList(pengawasData);
    } catch (err) {
      if (err instanceof ServiceError) {
        setError(err.message);
      } else {
        setError("Gagal memuat data. Silakan refresh halaman.");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    let active = true;

    fetchData()
      .then(([projectsData, pengawasData]) => {
        if (!active) return;
        setProjects(projectsData);
        setPengawasList(pengawasData);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ServiceError
            ? err.message
            : "Gagal memuat data. Silakan refresh halaman.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchData]);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const q = query.trim().toLowerCase();
        const matchQuery =
          !q ||
          `${p.id} ${p.design_name} ${p.customer_name} ${p.pengawas_name ?? ""} ${p.alamat_proyek ?? ""}`
            .toLowerCase()
            .includes(q);

        const matchStatus =
          statusFilter === "Semua status" ||
          STATUS_LABEL[p.status] === statusFilter ||
          p.status === statusFilter;

        const matchAllocation =
          allocationFilter === "Semua" ||
          (allocationFilter === "Sudah dialokasikan" && p.pengawas_id !== null) ||
          (allocationFilter === "Belum dialokasikan" && p.pengawas_id === null);

        return matchQuery && matchStatus && matchAllocation;
      }),
    [projects, query, statusFilter, allocationFilter],
  );

  const totalAllocated = projects.filter((p) => p.pengawas_id !== null).length;
  const totalUnallocated = projects.filter((p) => p.pengawas_id === null).length;

  const handleAssigned = (
    projectId: string,
    _pengawasId: string,
    pengawasName: string,
  ) => {
    setProjects((curr) =>
      curr.map((p) =>
        p.id === projectId
          ? { ...p, pengawas_id: _pengawasId, pengawas_name: pengawasName }
          : p,
      ),
    );
    setNotice(`Pengawas "${pengawasName}" berhasil dialokasikan ke proyek.`);
    window.setTimeout(() => setNotice(""), 5000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8 xl:p-10">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#e5eaf0] bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#477ba6] border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8 xl:p-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            onClick={load}
            className="mt-3 rounded-lg bg-[#183b57] px-4 py-2 text-xs font-semibold text-white hover:bg-[#234f70]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8 xl:p-10">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold text-[#64809a]">Alokasi Tim</p>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#17344e] md:text-[32px]">
            Alokasi Pengawas
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Kelola penugasan pengawas lapangan ke proyek yang membutuhkan.
            Alokasi bersifat tetap setelah dikonfirmasi.
          </p>
        </div>
      </section>

      {/* Notice */}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-[#cfe3d2] bg-[#edf7ee] px-4 py-3 text-xs font-medium text-[#477c50]"
        >
          ✓ {notice}
        </div>
      )}

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Total proyek",
            value: projects.length,
            tone: "text-[#294c69] bg-[#eaf1f6]",
          },
          {
            label: "Sudah dialokasikan",
            value: totalAllocated,
            tone: "text-[#477c50] bg-[#edf7ee]",
          },
          {
            label: "Belum dialokasikan",
            value: totalUnallocated,
            tone: "text-[#9a671f] bg-[#fff5e3]",
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="flex items-center justify-between rounded-xl border border-[#e5eaf0] bg-white p-4 md:p-5"
          >
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                {metric.label}
              </p>
              <strong className="mt-2 block text-2xl text-[#17344e]">
                {metric.value}
              </strong>
            </div>
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl text-lg font-bold ${metric.tone}`}
            >
              {metric.value}
            </span>
          </article>
        ))}
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#edf0f4] p-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="text-[15px] font-bold text-[#263d53]">
              Daftar Proyek
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Menampilkan {filtered.length} dari {projects.length} proyek
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Cari proyek</span>
              <span className="absolute left-3 top-2.5 text-slate-400">⌕</span>
              <input
                id="search-project-admin"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari proyek, pelanggan, pengawas..."
                className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15 sm:w-[240px]"
              />
            </label>
            <label>
              <span className="sr-only">Filter alokasi</span>
              <select
                id="filter-alokasi-admin"
                value={allocationFilter}
                onChange={(e) => setAllocationFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs text-slate-600 outline-none focus:border-[#477ba6] sm:w-auto"
              >
                <option>Semua</option>
                <option>Sudah dialokasikan</option>
                <option>Belum dialokasikan</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter status</span>
              <select
                id="filter-status-admin"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs text-slate-600 outline-none focus:border-[#477ba6] sm:w-auto"
              >
                <option>Semua status</option>
                {Object.values(STATUS_LABEL).map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-[10px] font-semibold text-slate-500">
                <th className="px-6 py-3">Proyek / Desain</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Status Proyek</th>
                <th className="px-4 py-3">Pengawas</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f4]">
              {filtered.map((project) => (
                <tr
                  key={project.id}
                  className="transition-colors hover:bg-[#fbfcfd]"
                >
                  <td className="px-6 py-4">
                    <span className="block font-semibold text-[#263d53]">
                      {project.design_name}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {project.id.slice(0, 8)}…
                      {project.alamat_proyek
                        ? ` · ${project.alamat_proyek.slice(0, 35)}${project.alamat_proyek.length > 35 ? "…" : ""}`
                        : ""}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="block text-slate-700">{project.customer_name}</span>
                    {project.customer_phone && (
                      <span className="block text-[10px] text-slate-400">
                        {project.customer_phone}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_CLASS[project.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {STATUS_LABEL[project.status] ?? project.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {project.pengawas_id ? (
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eaf1f6] text-[10px] font-bold text-[#355973]">
                          {(project.pengawas_name ?? "PW")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        <span className="text-slate-700">
                          {project.pengawas_name ?? "Pengawas Ditugaskan"}
                        </span>
                      </div>
                    ) : (
                      <span className="italic text-slate-400">Belum dialokasikan</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {project.pengawas_id ? (
                      <span className="inline-flex h-9 items-center rounded-lg border border-[#e5e9ed] px-3 text-[10px] font-semibold text-slate-400">
                        ✓ Sudah dialokasikan
                      </span>
                    ) : !canAllocateStaff(project.status) ? (
                      <span className="inline-flex h-9 items-center rounded-lg border border-[#e5e9ed] px-3 text-[10px] font-semibold text-slate-400">
                        Menunggu verifikasi dokumen
                      </span>
                    ) : (
                      <button
                        id={`allocate-btn-${project.id}`}
                        onClick={() => setSelectedProject(project)}
                        className="h-9 rounded-lg bg-[#183b57] px-4 text-xs font-semibold text-white hover:bg-[#234f70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6]"
                      >
                        Alokasikan Pengawas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    <p className="font-semibold">Tidak ada proyek ditemukan</p>
                    <p className="mt-1 text-xs">
                      Coba ubah kata kunci atau filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1 border-t border-[#edf0f4] px-5 py-3 text-[10px] text-slate-400 sm:flex-row sm:justify-between">
          <span>
            Menampilkan {filtered.length} dari {projects.length} proyek
          </span>
          <span>Data diambil dari database aktual.</span>
        </div>
      </section>

      {/* Modal */}
      {selectedProject && (
        <AssignPengawasModal
          project={selectedProject}
          pengawasList={pengawasList}
          onClose={() => setSelectedProject(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}
