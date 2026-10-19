"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  assignMandorsToProject,
  canAllocateStaff,
  finalizeProjectStaffing,
  getProjectsForPengawas,
  getVerifiedMandors,
  removeMandorFromProject,
  type AllocatedMandor,
  type ProjectForPengawas,
  type VerifiedMandor,
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
  menunggu_pengawas: "Ditugaskan",
};

const STATUS_CLASS: Record<string, string> = {
  berjalan: "bg-[#eaf2f8] text-[#416f91]",
  selesai: "bg-[#edf6ef] text-[#4d7d56]",
  alokasi_mandor_pengawas: "bg-amber-50 text-amber-700",
  default: "bg-[#f0f5f8] text-[#416f91]",
};

function getStatusClass(status: string) {
  return STATUS_CLASS[status] ?? STATUS_CLASS.default;
}

// ─── Mandor Allocation Modal ───────────────────────────────────────────────────

function MandorAllocationModal({
  project,
  allMandors,
  onClose,
  onSaved,
  onFinalized,
}: {
  project: ProjectForPengawas;
  allMandors: VerifiedMandor[];
  onClose: () => void;
  onSaved: (projectId: string, newMandors: AllocatedMandor[]) => void;
  onFinalized: (projectId: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localMandors, setLocalMandors] = useState<AllocatedMandor[]>(
    project.mandors,
  );

  const canSelectMandor = (mandor: VerifiedMandor) => {
    if (selectedIds.has(mandor.id)) return true;
    if (localMandors.length + selectedIds.size >= 3) return false;
    if (mandor.keahlian.length === 0) return false;

    const assignedSkills = [
      ...localMandors.flatMap((assigned) => assigned.keahlian),
      ...allMandors
        .filter((candidate) => selectedIds.has(candidate.id))
        .flatMap((candidate) => candidate.keahlian),
    ];
    return !mandor.keahlian.some((skill) => assignedSkills.includes(skill));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = createClient();
      const result = await assignMandorsToProject(
        supabase,
        project.id,
        Array.from(selectedIds),
      );

      // Build new AllocatedMandor entries for optimistic update
      const now = new Date().toISOString();
      const newlyAllocated: AllocatedMandor[] = allMandors
        .filter((m) => selectedIds.has(m.id))
        .map((m) => ({
          mandor_id: m.id,
          full_name: m.full_name,
          phone: m.phone,
          keahlian: m.keahlian,
          area_kerja: m.area_kerja,
          pengalaman_tahun: m.pengalaman_tahun,
          assigned_at: now,
        }));

      const updatedMandors = [...localMandors, ...newlyAllocated];
      setLocalMandors(updatedMandors);
      onSaved(project.id, updatedMandors);
      setSelectedIds(new Set());

      if (result.skipped > 0) {
        setSuccess(
          `${result.assigned} mandor berhasil dialokasikan, ${result.skipped} sudah ada.`,
        );
      } else {
        setSuccess(`${result.assigned} mandor berhasil dialokasikan.`);
      }
    } catch (err) {
      setError(
        err instanceof ServiceError ? err.message : "Terjadi kesalahan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);
    setSuccess(null);
    try {
      await finalizeProjectStaffing(createClient(), project.id);
      onFinalized(project.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof ServiceError ? err.message : "Gagal memfinalisasi alokasi.",
      );
    } finally {
      setFinalizing(false);
    }
  };

  const handleRemove = async (mandorId: string) => {
    setRemoving(mandorId);
    setError(null);
    setSuccess(null);
    try {
      const supabase = createClient();
      await removeMandorFromProject(supabase, project.id, mandorId);
      const updatedMandors = localMandors.filter(
        (m) => m.mandor_id !== mandorId,
      );
      setLocalMandors(updatedMandors);
      onSaved(project.id, updatedMandors);
      setSuccess("Mandor berhasil dihapus dari proyek.");
    } catch (err) {
      setError(
        err instanceof ServiceError ? err.message : "Gagal menghapus mandor.",
      );
    } finally {
      setRemoving(null);
    }
  };

  const currentAllocatedIds = new Set(localMandors.map((m) => m.mandor_id));
  const currentAvailable = allMandors.filter(
    (m) => !currentAllocatedIds.has(m.id),
  );

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
        aria-labelledby="mandor-alloc-title"
        className="flex max-h-[90vh] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#e8edf1] px-6 py-5">
          <div>
            <p className="text-[10px] text-slate-500">Alokasi Mandor</p>
            <h2
              id="mandor-alloc-title"
              className="mt-1 text-lg font-bold text-[#17344e]"
            >
              {project.design_name}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pelanggan: {project.customer_name}
              {project.alamat_proyek
                ? ` · ${project.alamat_proyek.slice(0, 50)}`
                : ""}
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

        <div className="flex-1 overflow-y-auto">
          {/* Notices */}
          <div className="px-5 pt-4 space-y-2">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
                ✓ {success}
              </div>
            )}
          </div>

          {/* Currently Allocated */}
          <div className="px-5 pt-4 pb-2">
            <h3 className="mb-2 text-xs font-bold text-[#263d53]">
              Mandor Teralokasikan ({localMandors.length})
            </h3>
            {localMandors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Belum ada mandor yang dialokasikan ke proyek ini.
              </p>
            ) : (
              <div className="space-y-2">
                {localMandors.map((m) => (
                  <div
                    key={m.mandor_id}
                    className="flex items-center gap-3 rounded-xl border border-[#e7ebef] bg-[#f8fafc] p-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf1f6] text-[10px] font-bold text-[#355973]">
                      {m.full_name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#29465e]">
                        {m.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {m.keahlian.length > 0
                          ? m.keahlian.join(", ")
                          : "Keahlian tidak tersedia"}
                        {m.area_kerja ? ` · ${m.area_kerja}` : ""}
                        {m.pengalaman_tahun
                          ? ` · ${m.pengalaman_tahun} thn pengalaman`
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(m.mandor_id)}
                      disabled={removing === m.mandor_id}
                      aria-label={`Hapus ${m.full_name}`}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removing === m.mandor_id ? "…" : "✕"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Mandors to Add */}
          <div className="px-5 pt-3 pb-4">
            <h3 className="mb-2 text-xs font-bold text-[#263d53]">
              Mandor Terverifikasi Tersedia ({currentAvailable.length})
            </h3>
            {currentAvailable.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d9e1e8] p-6 text-center">
                <p className="text-sm font-semibold text-[#365873]">
                  Tidak ada mandor tersedia untuk proyek ini
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Mandor yang masih menangani proyek aktif tidak dapat dipilih.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentAvailable.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleSelect(m.id)}
                    disabled={!canSelectMandor(m)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selectedIds.has(m.id)
                        ? "border-[#7395b1] bg-[#f0f5f8] ring-2 ring-[#7395b1]/15"
                        : canSelectMandor(m)
                          ? "border-[#e7ebef] hover:bg-slate-50"
                          : "cursor-not-allowed border-[#e7ebef] bg-slate-50 opacity-50"
                    }`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d8e3eb] bg-[#eaf1f6] text-[10px] font-bold text-[#355973]">
                      {m.full_name.slice(0, 2).toUpperCase()}
                    </span>
                    {!canSelectMandor(m) && (
                      <span className="block text-[10px] font-semibold text-amber-700">
                        {localMandors.length + selectedIds.size >= 3
                          ? "Batas 3 mandor per proyek sudah tercapai"
                          : m.keahlian.length === 0
                            ? "Keahlian mandor belum tercatat"
                            : "Keahlian sudah dimiliki mandor lain"}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm text-[#29465e]">
                        {m.full_name}
                      </b>
                      <span className="block text-[10px] text-slate-500">
                        {m.keahlian.length > 0
                          ? m.keahlian.join(", ")
                          : "Keahlian tidak tercatat"}
                        {m.area_kerja ? ` · ${m.area_kerja}` : ""}
                        {m.pengalaman_tahun
                          ? ` · ${m.pengalaman_tahun} thn`
                          : ""}
                      </span>
                      {m.phone && (
                        <span className="block text-[10px] text-slate-400">
                          {m.phone}
                        </span>
                      )}
                    </span>
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                        selectedIds.has(m.id)
                          ? "border-[#477ba6] bg-[#477ba6] text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedIds.has(m.id) ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-[#e8edf1] bg-[#fafbfc] px-5 py-4">
          <span className="text-xs text-slate-500">
            {selectedIds.size > 0
              ? `${selectedIds.size} mandor dipilih`
              : project.status === "alokasi_mandor_pengawas"
                ? "Alokasikan minimal satu mandor untuk lanjut ke tahap kontrak"
                : "Pilih satu atau lebih mandor"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 rounded-lg border border-[#dfe6ed] px-4 text-xs font-semibold text-slate-600 hover:bg-white"
            >
              Tutup
            </button>
            <button
              id="btn-alokasi-mandor"
              onClick={handleAssign}
              disabled={
                selectedIds.size === 0 ||
                submitting ||
                !canAllocateStaff(project.status)
              }
              className="h-10 rounded-lg bg-[#183b57] px-5 text-xs font-semibold text-white hover:bg-[#234f70] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting
                ? "Mengalokasikan..."
                : `Alokasikan ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""}`}
            </button>
            {project.status === "alokasi_mandor_pengawas" && (
              <button
                id="btn-finalisasi-alokasi"
                onClick={handleFinalize}
                disabled={
                  localMandors.length === 0 ||
                  selectedIds.size > 0 ||
                  submitting ||
                  finalizing
                }
                className="h-10 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {finalizing ? "Memproses..." : "Finalisasi & lanjut ke kontrak"}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function PengawasDashboard() {
  const [projects, setProjects] = useState<ProjectForPengawas[]>([]);
  const [allMandors, setAllMandors] = useState<VerifiedMandor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("Semua proyek");
  const [query, setQuery] = useState("");
  const [selectedProject, setSelectedProject] =
    useState<ProjectForPengawas | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    return Promise.all([
      getProjectsForPengawas(supabase),
      getVerifiedMandors(supabase),
    ]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsData, mandorsData] = await fetchData();
      setProjects(projectsData);
      setAllMandors(mandorsData);
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
      .then(([projectsData, mandorsData]) => {
        if (!active) return;
        setProjects(projectsData);
        setAllMandors(mandorsData);
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
      projects.filter(
        (p) =>
          `${p.id} ${p.design_name} ${p.customer_name} ${p.alamat_proyek ?? ""}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()) &&
          (filter === "Semua proyek" ||
            (filter === "Aktif"
              ? p.status !== "selesai" && p.status !== "batal"
              : p.status === "selesai" || p.status === "batal")),
      ),
    [projects, filter, query],
  );

  const active = projects.filter(
    (p) => p.status !== "selesai" && p.status !== "batal",
  ).length;
  const withoutMandor = projects.filter((p) => p.mandors.length === 0).length;

  const handleMandorsSaved = (
    projectId: string,
    newMandors: AllocatedMandor[],
  ) => {
    setProjects((curr) =>
      curr.map((p) =>
        p.id === projectId ? { ...p, mandors: newMandors } : p,
      ),
    );
    // Also update selectedProject so the modal reflects latest state
    if (selectedProject?.id === projectId) {
      setSelectedProject((prev) =>
        prev ? { ...prev, mandors: newMandors } : prev,
      );
    }
  };

  const handleStaffingFinalized = (projectId: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, status: "finalisasi_kontrak" }
          : project,
      ),
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-7 p-5 md:p-8 xl:p-10">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#e2e8ed] bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#5e83a0] border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">Memuat proyek Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-7 p-5 md:p-8 xl:p-10">
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
    <div className="mx-auto max-w-[1500px] space-y-7 p-5 md:p-8 xl:p-10">
      {/* Header */}
      <section className="flex flex-col justify-between gap-5 border-b border-[#dfe6ec] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold text-[#64809a]">
            Dashboard Pengawas
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-tight text-[#17344e] md:text-[34px]">
            Ringkasan operasional
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Pantau proyek yang dipercayakan kepada Anda, kelola tim mandor, dan
            pastikan setiap tahap bergerak sesuai rencana.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="min-w-[110px] border-l-2 border-[#6b91ae] pl-3">
            <p className="text-[10px] text-slate-500">Proyek aktif</p>
            <strong className="mt-1 block text-2xl text-[#183b57]">
              {active}
            </strong>
          </div>
          <div className="min-w-[140px] border-l-2 border-[#d7a348] pl-3">
            <p className="text-[10px] text-slate-500">Perlu mandor</p>
            <strong className="mt-1 block text-2xl text-[#183b57]">
              {withoutMandor}
            </strong>
          </div>
        </div>
      </section>

      {/* Project list */}
      <section id="proyek" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#263d53]">Proyek Anda</h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih proyek untuk membuka detail atau mengalokasikan mandor.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label>
              <span className="sr-only">Cari proyek</span>
              <input
                id="search-pengawas-proyek"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari proyek, customer, alamat..."
                className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs outline-none focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15 sm:w-[250px]"
              />
            </label>
            <label>
              <span className="sr-only">Filter daftar proyek</span>
              <select
                id="filter-proyek-pengawas"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-10 rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs text-slate-600 outline-none focus:border-[#477ba6]"
              >
                <option>Semua proyek</option>
                <option>Aktif</option>
                <option>Selesai</option>
              </select>
            </label>
          </div>
        </div>

        {filtered.length === 0 && projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d8e1e8] bg-white px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[#35546d]">
              Belum ada proyek ditugaskan
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Admin akan mengalokasikan proyek kepada Anda.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((project) => (
              <article
                key={project.id}
                className="overflow-hidden rounded-2xl border border-[#e2e8ed] bg-white"
              >
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start sm:px-6 sm:py-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#365873]">
                        #{project.id.slice(0, 8)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${getStatusClass(project.status)}`}
                      >
                        {STATUS_LABEL[project.status] ?? project.status}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-[#183b57]">
                      {project.design_name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {project.customer_name}
                      {project.alamat_proyek
                        ? ` · ${project.alamat_proyek.slice(0, 60)}`
                        : ""}
                    </p>
                  </div>
                  <Link
                    href={`/pengawas/proyek/${project.id}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#cfdce6] px-4 text-xs font-semibold text-[#355c78] hover:bg-[#f3f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6]"
                  >
                    Buka detail
                  </Link>
                </div>

                {/* Mandor section */}
                <div className="border-t border-[#edf0f3] bg-[#fafbfc] px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Tim Mandor ({project.mandors.length})
                      </p>
                      {project.mandors.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {project.mandors.map((m) => (
                            <span
                              key={m.mandor_id}
                              className="inline-flex items-center gap-1 rounded-full border border-[#d8e3eb] bg-[#eaf1f6] px-2.5 py-1 text-[10px] font-semibold text-[#355973]"
                            >
                              {m.full_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-400 italic">
                          Belum ada mandor dialokasikan
                        </p>
                      )}
                    </div>
                    <button
                      id={`kelola-mandor-${project.id}`}
                      onClick={() => setSelectedProject(project)}
                      disabled={!canAllocateStaff(project.status)}
                      className="ml-3 shrink-0 rounded-lg border border-[#183b57] px-3 py-2 text-[11px] font-semibold text-[#183b57] hover:bg-[#183b57] hover:text-white transition-colors"
                    >
                      {!canAllocateStaff(project.status)
                        ? "Menunggu verifikasi kontrak"
                        : project.mandors.length === 0
                          ? "Alokasikan Mandor"
                          : "Kelola Mandor"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {filtered.length === 0 && projects.length > 0 && (
          <div className="rounded-xl border border-dashed border-[#d8e1e8] bg-white px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[#35546d]">
              Tidak ada proyek ditemukan
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ubah kata kunci atau filter proyek.
            </p>
          </div>
        )}
      </section>

      <footer className="border-t border-[#dfe6ec] pt-4 text-[10px] text-slate-400">
        Data diambil langsung dari database. Alokasi mandor tersimpan secara
        permanen dan terlihat setelah refresh.
      </footer>

      {/* Mandor Allocation Modal */}
      {selectedProject && (
        <MandorAllocationModal
          project={selectedProject}
          allMandors={allMandors}
          onClose={() => setSelectedProject(null)}
          onSaved={handleMandorsSaved}
          onFinalized={handleStaffingFinalized}
        />
      )}
    </div>
  );
}
