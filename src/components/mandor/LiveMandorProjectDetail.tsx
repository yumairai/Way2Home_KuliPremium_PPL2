"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  getProjectProgress,
  getProjectProgressAccess,
  getProjectIssues,
  submitProjectIssue,
  submitProgressReport,
  type LiveProgressProject,
} from "@/services/progress.service";

export default function LiveMandorProjectDetail({ id }: { id: string }) {
  const [project, setProject] = useState<LiveProgressProject | null>(null);
  const [stageId, setStageId] = useState("");
  const [percentage, setPercentage] = useState("0");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Awaited<ReturnType<typeof getProjectIssues>>>([]);
  const [issueDescription, setIssueDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockedMessage, setBlockedMessage] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    const projectStatus = await getProjectProgressAccess(supabase, id);
    if (projectStatus !== "berjalan" && projectStatus !== "selesai") {
      setProject(null);
      setBlockedMessage(
        projectStatus === "pembayaran_dp"
          ? "Tracking proyek tersedia setelah pembayaran DP terverifikasi."
          : "Tracking proyek belum tersedia pada tahap proyek ini.",
      );
      return;
    }

    setBlockedMessage("");
    const progress = await getProjectProgress(supabase, id);
    const projectIssues = await getProjectIssues(supabase, id);
    setIssues(projectIssues);
    setProject((current) =>
      current
        ? { ...current, ...progress }
        : {
            id,
            customerId: "",
            customerName: "Customer",
            designName: "Desain rumah",
            address: null,
            status: "berjalan",
            ...progress,
          },
    );
    if (!stageId && progress.stages[0]) setStageId(progress.stages[0].id);
  }, [id, stageId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
        .catch(() => setMessage("Gagal memuat data proyek."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) return <p className="p-8 text-sm text-slate-500">Memuat proyek...</p>;
  if (blockedMessage)
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <section className="rounded-2xl border border-[#e2e8ed] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#183b57]">
            Tracking belum tersedia
          </h1>
          <p className="mt-2 text-sm text-slate-500">{blockedMessage}</p>
          <Link
            href="/mandor/proyek"
            className="mt-4 inline-block text-sm font-semibold text-[#35658a] underline"
          >
            Kembali ke proyek
          </Link>
        </section>
      </main>
    );
  if (!project)
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Proyek tidak ditemukan.</p>
        <Link href="/mandor/proyek" className="mt-3 inline-block text-sm font-semibold underline">
          Kembali ke proyek
        </Link>
      </div>
    );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      await submitProgressReport(supabase, {
        projectStageId: stageId,
        persentase: Number(percentage),
        keterangan: note.trim(),
      });
      setNote("");
      setMessage("Laporan terkirim dan menunggu verifikasi Pengawas.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim laporan.");
    }
  };

  const submitIssue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await submitProjectIssue(supabase, {
        projectId: id,
        description: issueDescription.trim(),
        projectStageId: stageId,
      });
      setIssueDescription("");
      setMessage("Kendala terkirim kepada Pengawas.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim kendala.");
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] space-y-6 px-5 py-8">
      <Link href="/mandor/proyek" className="text-sm font-semibold text-[#35658a] underline">
        Kembali ke proyek
      </Link>
      <header className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <p className="text-xs text-slate-500">{project.designName} · {project.status}</p>
        <h1 className="mt-2 text-2xl font-bold text-[#183b57]">Proyek pembangunan</h1>
        <p className="mt-1 text-sm text-slate-500">{project.address ?? "Alamat belum tersedia"}</p>
        <p className="mt-4 text-sm">Progress resmi: <b>{project.overallProgress ?? "—"}%</b></p>
      </header>
      <section className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <h2 className="text-lg font-bold text-[#183b57]">Enam tahap pembangunan</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {project.stages.map((stage) => (
            <div key={stage.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">{stage.urutan}. {stage.nama_tahap}</p>
              <p className="mt-2 text-xl font-bold">{stage.progress_percentage}%</p>
              <p className="text-xs text-slate-500">{stage.status}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <h2 className="text-lg font-bold text-[#183b57]">Laporan kendala</h2>
        <form onSubmit={submitIssue} className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <select value={stageId} onChange={(event) => setStageId(event.target.value)} className="h-10 rounded-lg border px-3 text-sm">
            {project.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nama_tahap}</option>)}
          </select>
          <input required value={issueDescription} onChange={(event) => setIssueDescription(event.target.value)} placeholder="Jelaskan kendala di lapangan" className="h-10 rounded-lg border px-3 text-sm" />
          <button type="submit" className="h-10 rounded-lg bg-[#183b57] px-4 text-xs font-semibold text-white">Kirim kendala</button>
        </form>
        <div className="mt-4 space-y-2">
          {issues.map((issue) => <div key={issue.id} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{issue.status}</b><p className="mt-1 text-slate-600">{issue.deskripsi}</p><p className="mt-1 text-xs text-slate-500">{issue.tindak_lanjut ?? "Belum ada tindak lanjut"}</p></div>)}
          {!issues.length && <p className="text-sm text-slate-500">Belum ada kendala.</p>}
        </div>
      </section>
      <section className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <h2 className="text-lg font-bold text-[#183b57]">Kirim laporan progress</h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-3">
          <select value={stageId} onChange={(event) => setStageId(event.target.value)} className="h-10 rounded-lg border px-3 text-sm">
            {project.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nama_tahap}</option>)}
          </select>
          <input type="number" min="0" max="100" value={percentage} onChange={(event) => setPercentage(event.target.value)} className="h-10 rounded-lg border px-3 text-sm" />
          <input required minLength={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Keterangan pekerjaan" className="h-10 rounded-lg border px-3 text-sm" />
          <button type="submit" className="h-10 rounded-lg bg-[#2B3361] px-4 text-sm font-semibold text-white md:col-span-3">Kirim laporan</button>
        </form>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </section>
      <section className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <h2 className="text-lg font-bold text-[#183b57]">Riwayat laporan</h2>
        <div className="mt-4 space-y-3">
          {project.reports.map((report) => (
            <article key={report.id} className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold">{project.stages.find((stage) => stage.id === report.project_stage_id)?.nama_tahap ?? "Tahap"} · {report.persentase}%</p>
              <p className="mt-1 text-slate-600">{report.keterangan}</p>
              <p className="mt-2 text-xs text-slate-500">{report.status} · {report.feedback ?? report.reviewer_note ?? "Belum ada feedback"}</p>
            </article>
          ))}
          {!project.reports.length && <p className="text-sm text-slate-500">Belum ada laporan.</p>}
        </div>
      </section>
    </main>
  );
}
