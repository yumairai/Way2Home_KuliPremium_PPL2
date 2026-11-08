"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  getProjectProgress,
  getProjectProgressAccess,
  getProjectIssues,
  updateProjectIssue,
  reviewProgressReport,
  type LiveProgressProject,
} from "@/services/progress.service";

export default function LiveSupervisorProjectDetail({ id }: { id: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [project, setProject] = useState<LiveProgressProject | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Awaited<ReturnType<typeof getProjectIssues>>>([]);
  const [blockedMessage, setBlockedMessage] = useState("");

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
    setIssues(await getProjectIssues(supabase, id));
    setProject((current) =>
      current ? { ...current, ...progress } : {
        id,
        customerId: "",
        customerName: "Customer",
        designName: "Desain rumah",
        address: null,
        status: "berjalan",
        ...progress,
      },
    );
  }, [id, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch(() => setMessage("Gagal memuat data proyek."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const decide = async (reportId: string, decision: "approve" | "reject") => {
    setMessage("");
    try {
      await reviewProgressReport(supabase, reportId, decision, feedback[reportId]);
      setMessage(decision === "approve" ? "Laporan disetujui." : "Laporan ditolak.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memproses laporan.");
    }
  };

  const resolveIssue = async (issueId: string, status: "reviewed" | "resolved") => {
    try {
      await updateProjectIssue(supabase, issueId, {
        status,
        tindak_lanjut: status === "resolved" ? "Kendala telah diselesaikan." : "Sedang ditindaklanjuti.",
      });
      setIssues(await getProjectIssues(supabase, id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memperbarui kendala.");
    }
  };

  if (blockedMessage)
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <section className="rounded-2xl border border-[#e2e8ed] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#183b57]">
            Tracking belum tersedia
          </h1>
          <p className="mt-2 text-sm text-slate-500">{blockedMessage}</p>
          <Link
            href="/pengawas"
            className="mt-4 inline-block text-sm font-semibold text-[#35658a] underline"
          >
            Kembali ke dashboard
          </Link>
        </section>
      </main>
    );
  if (!project) return <p className="p-8 text-sm text-slate-500">Memuat proyek...</p>;

  return (
    <main className="mx-auto max-w-[1200px] space-y-6 px-5 py-8">
      <Link href="/pengawas" className="text-sm font-semibold text-[#35658a] underline">Kembali ke dashboard</Link>
      <header className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <p className="text-xs text-slate-500">{project.designName} · {project.status}</p>
        <h1 className="mt-2 text-2xl font-bold text-[#183b57]">Proyek pembangunan</h1>
        <p className="mt-1 text-sm text-slate-500">{project.address ?? "Alamat belum tersedia"} · Customer: {project.customerName}</p>
        <p className="mt-4 text-sm">Progress keseluruhan: <b>{project.overallProgress ?? "—"}%</b></p>
      </header>
      <section className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <h2 className="text-lg font-bold text-[#183b57]">Progress resmi per tahap</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {project.stages.map((stage) => (
            <div key={stage.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">{stage.urutan}. {stage.nama_tahap}</p>
              <p className="mt-2 text-xl font-bold">{stage.progress_percentage}%</p>
              <p className="text-xs text-slate-500">{stage.status}</p>
              <p className="mt-2 text-xs text-slate-600">{stage.keterangan ?? "Belum ada keterangan"}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <h2 className="text-lg font-bold text-[#183b57]">Kendala proyek</h2>
        <div className="mt-4 space-y-3">
          {issues.map((issue) => (
            <article key={issue.id} className="rounded-xl border border-slate-200 p-4 text-sm">
              <p className="font-semibold">{issue.status}</p>
              <p className="mt-1 text-slate-600">{issue.deskripsi}</p>
              <p className="mt-1 text-xs text-slate-500">{issue.tindak_lanjut ?? "Belum ada tindak lanjut"}</p>
              {issue.status !== "resolved" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => resolveIssue(issue.id, "reviewed")} className="rounded-lg border px-3 py-2 text-xs">Tindak lanjuti</button>
                  <button onClick={() => resolveIssue(issue.id, "resolved")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Selesaikan</button>
                </div>
              )}
            </article>
          ))}
          {!issues.length && <p className="text-sm text-slate-500">Belum ada kendala.</p>}
        </div>
      </section>
      <section className="rounded-2xl border border-[#e2e8ed] bg-white p-6">
        <h2 className="text-lg font-bold text-[#183b57]">Laporan Mandor</h2>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
        <div className="mt-4 space-y-3">
          {project.reports.map((report) => (
            <article key={report.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <b>{project.stages.find((stage) => stage.id === report.project_stage_id)?.nama_tahap ?? "Tahap"} · {report.persentase}%</b>
                <span className="text-slate-500">{report.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{report.keterangan}</p>
              {report.status === "pending" && (
                <>
                  <textarea
                    value={feedback[report.id] ?? ""}
                    onChange={(event) => setFeedback((current) => ({ ...current, [report.id]: event.target.value }))}
                    placeholder="Feedback Pengawas"
                    className="mt-3 min-h-20 w-full rounded-lg border p-3 text-sm"
                  />
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => decide(report.id, "approve")} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white">Setujui</button>
                    <button onClick={() => decide(report.id, "reject")} className="rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white">Tolak</button>
                  </div>
                </>
              )}
              {report.feedback && <p className="mt-2 text-xs text-slate-500">Feedback: {report.feedback}</p>}
            </article>
          ))}
          {!project.reports.length && <p className="text-sm text-slate-500">Belum ada laporan.</p>}
        </div>
      </section>
    </main>
  );
}
