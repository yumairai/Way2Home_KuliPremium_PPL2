"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
    initialSupervisorProjects,
    initialSupervisors,
    type Supervisor,
    type SupervisorProject,
} from "@/data/admin-supervisors";

const statusClass = {
    Tersedia: "bg-[#edf6ef] text-[#4e8058]",
    "Sedang bertugas": "bg-[#fbf2e3] text-[#9b6a24]",
};

function AssignmentModal({
    supervisor,
    projects,
    onClose,
    onAssign,
}: {
    supervisor: Supervisor;
    projects: SupervisorProject[];
    onClose: () => void;
    onAssign: (project: SupervisorProject) => void;
}) {
    const [selectedProject, setSelectedProject] = useState<string>("");
    const selected = projects.find((project) => project.id === selectedProject);
    return (
        <div
            className="fixed inset-0 z-[70] grid place-items-center bg-[#0c1b2b]/60 p-4 backdrop-blur-[3px]"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="assign-title"
                className="w-full max-w-[760px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <header className="flex items-center justify-between border-b border-[#e8edf1] px-6 py-5">
                    <div>
                        <p className="text-[10px] text-slate-500">Penugasan lapangan</p>
                        <h2
                            id="assign-title"
                            className="mt-1 text-lg font-bold text-[#17344e]"
                        >
                            Pilih proyek untuk {supervisor.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Tutup"
                        className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-xl text-slate-500 hover:bg-slate-50"
                    >
                        ×
                    </button>
                </header>
                <div className="max-h-[55vh] space-y-2 overflow-y-auto p-5">
                    {projects.length ? (
                        projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => setSelectedProject(project.id)}
                                className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-colors ${selectedProject === project.id ? "border-[#7395b1] bg-[#f0f5f8] ring-2 ring-[#7395b1]/15" : "border-[#e7ebef] hover:bg-slate-50"}`}
                            >
                                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                    <Image
                                        src={project.image}
                                        alt=""
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </div>
                                <span className="min-w-0 flex-1">
                                    <b className="block truncate text-xs text-[#29465e]">
                                        {project.title}
                                    </b>
                                    <span className="mt-1 block text-[10px] text-slate-500">
                                        #{project.id} · {project.category}
                                    </span>
                                    <span className="mt-1 block truncate text-[10px] text-slate-400">
                                        {project.address}
                                    </span>
                                </span>
                                <span
                                    className={`grid h-5 w-5 place-items-center rounded-full border ${selectedProject === project.id ? "border-[#477ba6] bg-[#477ba6] text-white" : "border-slate-300"}`}
                                >
                                    {selectedProject === project.id ? "✓" : ""}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="rounded-xl border border-dashed border-[#d9e1e8] p-9 text-center">
                            <p className="text-sm font-semibold text-[#365873]">
                                Semua proyek sudah ditugaskan
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Proyek baru akan muncul di sini jika menunggu pengawas.
                            </p>
                        </div>
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
                        onClick={() => {
                            if (selected) onAssign(selected);
                        }}
                        disabled={!selected}
                        className="h-10 rounded-lg bg-[#183b57] px-5 text-xs font-semibold text-white hover:bg-[#234f70] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Tugaskan proyek
                    </button>
                </footer>
            </section>
        </div>
    );
}

export default function SupervisorManagement() {
    const [supervisors, setSupervisors] = useState(initialSupervisors);
    const [projects, setProjects] = useState(initialSupervisorProjects);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("Semua status");
    const [selectedSupervisor, setSelectedSupervisor] =
        useState<Supervisor | null>(null);
    const [notice, setNotice] = useState("");
    const filtered = useMemo(
        () =>
            supervisors.filter(
                (supervisor) =>
                    `${supervisor.name} ${supervisor.email} ${supervisor.currentProject ?? ""}`
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()) &&
                    (statusFilter === "Semua status" ||
                        supervisor.status === statusFilter),
            ),
        [supervisors, query, statusFilter],
    );
    const available = supervisors.filter(
        (supervisor) => supervisor.status === "Tersedia",
    ).length;
    const assign = (project: SupervisorProject) => {
        if (!selectedSupervisor) return;
        setSupervisors((current) =>
            current.map((supervisor) =>
                supervisor.id === selectedSupervisor.id
                    ? {
                        ...supervisor,
                        status: "Sedang bertugas",
                        currentProject: project.title,
                    }
                    : supervisor,
            ),
        );
        setProjects((current) => current.filter((item) => item.id !== project.id));
        setNotice(`${project.title} ditugaskan kepada ${selectedSupervisor.name}.`);
        setSelectedSupervisor(null);
        window.setTimeout(() => setNotice(""), 3600);
    };
    const metrics = [
        {
            label: "Total pengawas",
            value: supervisors.length,
            tone: "text-[#294c69] bg-[#eaf1f6]",
        },
        {
            label: "Tersedia",
            value: available,
            tone: "text-[#477c50] bg-[#edf7ee]",
        },
        {
            label: "Sedang bertugas",
            value: supervisors.length - available,
            tone: "text-[#9a671f] bg-[#fff5e3]",
        },
    ];
    return (
        <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8 xl:p-10">
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="text-xs font-semibold text-[#64809a]">Tim lapangan</p>
                    <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#17344e] md:text-[32px]">
                        Manajemen pengawas
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">
                        Kelola ketersediaan pengawas dan distribusikan proyek yang menunggu
                        penugasan.
                    </p>
                </div>
            </section>
            {notice && (
                <div
                    role="status"
                    className="rounded-xl border border-[#cfe3d2] bg-[#edf7ee] px-4 py-3 text-xs font-medium text-[#477c50]"
                >
                    {notice}
                </div>
            )}
            <section className="grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
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
                    </article>
                ))}
            </section>
            <section className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white">
                <div className="flex flex-col gap-4 border-b border-[#edf0f4] p-5 md:flex-row md:items-center md:justify-between md:px-6">
                    <div>
                        <h2 className="text-[15px] font-bold text-[#263d53]">
                            Daftar pengawas lapangan
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Cari personel atau proyek untuk melihat penugasan.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <label className="relative">
                            <span className="sr-only">Cari pengawas</span>
                            <span className="absolute left-3 top-2.5 text-slate-400">⌕</span>
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Cari nama, email, proyek..."
                                className="h-10 w-full rounded-lg border border-[#dfe6ed] pl-9 pr-3 text-xs outline-none focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15 sm:w-[250px]"
                            />
                        </label>
                        <label>
                            <span className="sr-only">Filter ketersediaan</span>
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="h-10 rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs text-slate-600 outline-none focus:border-[#477ba6]"
                            >
                                <option>Semua status</option>
                                <option>Tersedia</option>
                                <option>Sedang bertugas</option>
                            </select>
                        </label>
                    </div>
                </div>
                <div className="divide-y divide-[#edf0f4]">
                    {filtered.map((supervisor) => (
                        <article
                            key={supervisor.id}
                            className="grid gap-4 px-5 py-5 transition-colors hover:bg-[#fbfcfd] md:grid-cols-[minmax(230px,1.1fr)_minmax(150px,.75fr)_minmax(220px,1fr)_auto] md:items-center md:px-6"
                        >
                            <div className="flex items-center gap-3">
                                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#d8e3eb] bg-[#eaf1f6] text-sm font-bold text-[#355973]">
                                    {supervisor.initials}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-[#29445c]">
                                        {supervisor.name}
                                    </h3>
                                    <p className="mt-1 truncate text-[10px] text-slate-500">
                                        {supervisor.email}
                                    </p>
                                    <p className="mt-1 text-[9px] text-slate-400">
                                        ID {supervisor.id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5 md:block">
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass[supervisor.status]}`}
                                >
                                    {supervisor.status}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    ★ {supervisor.rating.toFixed(1)}{" "}
                                    <span className="text-slate-400">
                                        · {supervisor.completedProjects} proyek selesai
                                    </span>
                                </span>
                            </div>
                            <div className="min-w-0 rounded-lg bg-[#f6f8fa] px-3 py-2.5">
                                <p className="text-[9px] font-semibold text-slate-400">
                                    {supervisor.currentProject
                                        ? "Proyek yang ditangani"
                                        : "Status proyek"}
                                </p>
                                <p className="mt-1 truncate text-xs font-medium text-[#40596f]">
                                    {supervisor.currentProject ?? "Belum ada proyek aktif"}
                                </p>
                            </div>
                            <div className="flex justify-end">
                                {supervisor.status === "Tersedia" ? (
                                    <button
                                        onClick={() => setSelectedSupervisor(supervisor)}
                                        className="h-10 w-full rounded-lg bg-[#183b57] px-4 text-xs font-semibold text-white hover:bg-[#234f70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6] md:w-auto"
                                    >
                                        Tugaskan proyek
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="h-10 w-full cursor-not-allowed rounded-lg border border-[#e5e9ed] px-4 text-xs font-semibold text-slate-400 md:w-auto"
                                    >
                                        Sedang bertugas
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                    {filtered.length === 0 && (
                        <div className="px-6 py-14 text-center">
                            <p className="text-sm font-semibold text-[#35546d]">
                                Pengawas tidak ditemukan
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Coba kata kunci lain atau ubah filter ketersediaan.
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-1 border-t border-[#edf0f4] px-5 py-3 text-[10px] text-slate-400 sm:flex-row sm:justify-between">
                    <span>
                        Menampilkan {filtered.length} dari {supervisors.length} pengawas
                        demo
                    </span>
                    <span>Penugasan akan direset saat halaman dimuat ulang.</span>
                </div>
            </section>
            <p className="text-[10px] leading-5 text-slate-400">
                Data pengawas dan proyek pada halaman ini merupakan simulasi. Tidak ada
                perubahan yang dikirim ke server.
            </p>
            {selectedSupervisor && (
                <AssignmentModal
                    supervisor={selectedSupervisor}
                    projects={projects}
                    onClose={() => setSelectedSupervisor(null)}
                    onAssign={assign}
                />
            )}
        </div>
    );
}
