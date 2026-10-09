"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Project } from "@/types/proyek";
import type { ConstructionMilestone, ProjectGalleryItem } from "@/types/project-tracking";
import { TRACKING_MILESTONE_TEMPLATE } from "@/data/project-tracking";
import { formatDate } from "@/utils/format";

const milestoneStyle = {
  completed: { label: "Selesai", dot: "bg-[#0b8068]", ring: "ring-[#bce7d9]", text: "text-[#0b8068]" },
  "in-progress": { label: "Sedang dikerjakan", dot: "bg-[#045ec2]", ring: "ring-[#bfd8f6]", text: "text-[#045ec2]" },
  pending: { label: "Belum dimulai", dot: "bg-[#cbd5e1]", ring: "ring-[#e8edf3]", text: "text-[#758398]" },
} as const;

function dateLabel(value?: string) {
  return value ? formatDate(value) : "Belum tersedia";
}

function percentLabel(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export default function CustomerTracking({ project }: { project: Project }) {
  const milestones = useMemo(() => {
    const data = project.tracking?.milestones ?? [];
    return TRACKING_MILESTONE_TEMPLATE.map((template) => {
      const found = data.find((item) => item.id === template.id);
      return found ?? { ...template, status: "pending" as const, tasks: [] };
    });
  }, [project.tracking?.milestones]);
  const initialActive = milestones.find((item) => item.status === "in-progress") ?? milestones.find((item) => item.status === "completed") ?? milestones[0];
  const [selectedId, setSelectedId] = useState(initialActive.id);
  const [lightboxItem, setLightboxItem] = useState<ProjectGalleryItem | null>(null);
  const selected = milestones.find((item) => item.id === selectedId) ?? milestones[0];
  const activities = project.tracking?.activities ?? [];
  const gallery = project.tracking?.gallery ?? [];
  const hasTrackingMilestones = (project.tracking?.milestones.length ?? 0) > 0;
  const completedCount = milestones.filter((item) => item.status === "completed").length;
  const progress = project.status === "Selesai" ? 100 : hasTrackingMilestones ? Math.round((completedCount / milestones.length) * 100) : null;
  const currentMilestone = milestones.find((item) => item.status === "in-progress");
  const targetDate = project.tracking?.targetDate;

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 pt-28 text-[#15243d]">
      <div className="mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-10">
        <a href={`/proyek/${project.id}`} className="inline-flex items-center gap-2 rounded-full py-2 text-sm font-semibold text-[#53647c] transition hover:text-[#004796] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#045ec2]">
          <span aria-hidden="true">←</span> Kembali ke detail proyek
        </a>

        {project.status === "Selesai" && (
          <div className="mt-5 flex gap-4 rounded-2xl border border-[#bce7d9] bg-[#effaf6] p-5 text-[#145b4d]">
            <span className="mt-0.5 text-xl" aria-hidden="true">✓</span>
            <div><h2 className="font-bold">Pembangunan selesai</h2><p className="mt-1 text-sm leading-6">Riwayat tahapan dan dokumentasi proyek tetap dapat dilihat di halaman ini.</p></div>
          </div>
        )}

        <header className="mt-7 grid gap-8 overflow-hidden rounded-[1.75rem] border border-[#dce5ef] bg-white p-6 shadow-[0_14px_36px_rgba(21,36,61,0.045)] md:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${project.status === "Selesai" ? "bg-[#eff4f7] text-[#53647c]" : "bg-[#e8f4f0] text-[#0b8068]"}`}>{project.status}</span>
              <span className="text-sm text-[#728198]">{project.designName} · {project.location}</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.035em] md:text-5xl">Perjalanan pembangunan rumah Anda</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66768c]">Pantau tahapan konstruksi, catatan tim, dan dokumentasi dalam satu tempat.</p>
          </div>
          <div className="rounded-2xl bg-[#f4f8fc] p-5 md:p-6">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm font-semibold text-[#52637b]">Progres konstruksi</p><p className="mt-1 text-xs text-[#8390a2]">{hasTrackingMilestones || project.status === "Selesai" ? "Berdasarkan milestone yang selesai" : "Belum ada data milestone"}</p></div>
              <p className="text-3xl font-extrabold tracking-tight text-[#004796]">{progress === null ? "—" : <>{percentLabel(progress)}<span className="text-lg">%</span></>}</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#dfe8f1]" role="progressbar" aria-label="Progres konstruksi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#004796] to-[#1685ca] transition-[width] duration-500" style={{ width: `${progress ?? 0}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#e2eaf2] pt-4">
              <div><p className="text-xs font-semibold text-[#8190a3]">Tahap saat ini</p><p className="mt-1 text-sm font-bold text-[#20334f]">{project.status === "Selesai" ? "Serah Terima" : currentMilestone?.title ?? "Belum diperbarui"}</p></div>
              <div><p className="text-xs font-semibold text-[#8190a3]">Target selesai</p><p className="mt-1 text-sm font-bold text-[#20334f]">{dateLabel(targetDate)}</p></div>
            </div>
          </div>
        </header>

        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]" aria-label="Tahapan dan tim proyek">
          <div className="min-w-0 rounded-[1.75rem] border border-[#dce5ef] bg-white p-5 shadow-[0_14px_36px_rgba(21,36,61,0.04)] md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e8edf3] pb-5">
              <div><h2 className="text-xl font-extrabold tracking-tight">Tahapan konstruksi</h2><p className="mt-1 text-sm text-[#728198]">Pilih tahap untuk melihat rincian pengerjaan.</p></div>
              <span className="text-xs font-semibold text-[#728198]">{completedCount} dari {milestones.length} tahap selesai</span>
            </div>

            <div className="grid gap-7 pt-6 lg:grid-cols-[minmax(230px,0.7fr)_minmax(0,1.3fr)]">
              <ol className="relative space-y-1" aria-label="Timeline milestone">
                <span className="absolute bottom-7 left-[17px] top-7 w-px bg-[#e2e9f0]" aria-hidden="true" />
                {milestones.map((milestone, index) => {
                  const style = milestoneStyle[milestone.status];
                  const active = milestone.id === selectedId;
                  return (
                    <li key={milestone.id} className="relative">
                      <button type="button" onClick={() => setSelectedId(milestone.id)} aria-current={active ? "step" : undefined} className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2] ${active ? "bg-[#f1f7fc]" : "hover:bg-[#f8fafc]"}`}>
                        <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white ring-4 ${style.ring} ${style.text}`}>
                          {milestone.status === "completed" ? <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg> : <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />}
                        </span>
                        <span className="min-w-0 flex-1 pt-0.5">
                          <span className={`block text-sm font-bold ${active ? "text-[#004796]" : "text-[#263a56]"}`}>{String(index + 1).padStart(2, "0")} <span className="ml-1">{milestone.title}</span></span>
                          <span className={`mt-1 block text-xs font-semibold ${style.text}`}>{style.label}</span>
                          <span className="mt-1 block text-xs text-[#8996a6]">{milestone.completedAt ? formatDate(milestone.completedAt) : milestone.startedAt ? `Mulai ${formatDate(milestone.startedAt)}` : "Tanggal belum tersedia"}</span>
                        </span>
                        <span className={`pt-2 text-sm transition-transform ${active ? "translate-x-0.5 text-[#045ec2]" : "text-[#9ba7b5]"}`} aria-hidden="true">›</span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <MilestoneDetail milestone={selected} />
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-[#dce5ef] bg-white p-6 shadow-[0_14px_36px_rgba(21,36,61,0.04)]">
            <h2 className="text-xl font-extrabold tracking-tight">Tim proyek</h2>
            <p className="mt-1 text-sm text-[#728198]">Hubungi personel yang mendampingi pembangunan.</p>
            <div className="mt-5 divide-y divide-[#e8edf3]">
              {(["Mandor", "Pengawas"] as const).map((role) => {
                const member = project.team.find((item) => item.role === role);
                return <div key={role} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf4fb] text-sm font-extrabold text-[#145a9d]">{member?.name.split(" ").map((part) => part[0]).slice(0, 2).join("") ?? role[0]}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#20334f]">{member?.name ?? `${role} belum ditugaskan`}</p><p className="mt-0.5 text-xs text-[#7b899a]">{role}{member?.experience ? ` · ${member.experience}` : ""}</p></div>
                  {member?.phone ? <a href={`https://wa.me/${member.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label={`Hubungi ${role} melalui WhatsApp`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#cde8df] bg-[#f1faf6] text-[#0b8068] transition hover:bg-[#e3f5ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2]"><WhatsAppIcon /></a> : <span title="Nomor belum tersedia" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1f4f7] text-[#9aa6b3]" aria-label="Nomor belum tersedia"><WhatsAppIcon /></span>}
                </div>;
              })}
            </div>
            <div className="mt-5 rounded-xl bg-[#f5f8fb] px-4 py-3"><p className="text-xs font-semibold text-[#7a899b]">Mulai pembangunan</p><p className="mt-1 text-sm font-bold text-[#263a56]">{dateLabel(project.tracking?.startedAt)}</p></div>
          </aside>
        </section>

        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
          <section className="rounded-[1.75rem] border border-[#dce5ef] bg-white p-6 shadow-[0_14px_36px_rgba(21,36,61,0.04)] md:p-8">
            <div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold tracking-tight">Catatan tim</h2><p className="mt-1 text-sm text-[#728198]">Pembaruan terbaru dari mandor dan pengawas.</p></div>{activities.length > 0 && <span className="text-xs font-semibold text-[#728198]">{activities.length} pembaruan</span>}</div>
            {activities.length ? <ol className="mt-6">{[...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((activity) => <li key={activity.id} className="relative flex gap-4 pb-6 last:pb-0"><span className="absolute bottom-0 left-[15px] top-8 w-px bg-[#e5ebf1]" aria-hidden="true"/><span className={`relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${activity.authorRole === "Mandor" ? "bg-[#e8f2fc] text-[#145a9d]" : "bg-[#e9f6f1] text-[#0b8068]"}`}>{activity.authorName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-sm font-bold text-[#263a56]">{activity.title}</p><time className="text-xs text-[#8290a1]" dateTime={activity.createdAt}>{formatDate(activity.createdAt)}</time></div><p className="mt-1 text-sm leading-6 text-[#66768c]">{activity.description}</p><p className="mt-2 text-xs font-semibold text-[#8290a1]">{activity.authorName} · {activity.authorRole}</p></div></li>)}</ol> : <EmptyState title="Belum ada catatan" description="Pembaruan dari mandor dan pengawas akan muncul di sini setelah pekerjaan dimulai." />}
          </section>

          <section className="rounded-[1.75rem] border border-[#dce5ef] bg-white p-6 shadow-[0_14px_36px_rgba(21,36,61,0.04)] md:p-8">
            <div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold tracking-tight">Dokumentasi proyek</h2><p className="mt-1 text-sm text-[#728198]">Foto progres terbaru pembangunan.</p></div>{gallery.length > 0 && <span className="text-xs font-semibold text-[#728198]">{gallery.length} foto</span>}</div>
            {gallery.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">{[...gallery].sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)).map((item) => <button type="button" key={item.id} onClick={() => setLightboxItem(item)} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#edf2f7] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2]"><Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover transition duration-300 group-hover:scale-[1.03]"/><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12223c]/75 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white">{item.caption ?? item.alt}</span></button>)}</div> : <EmptyState title="Dokumentasi belum tersedia" description="Foto pekerjaan akan ditambahkan oleh tim saat progres pembangunan berlangsung." />}
          </section>
        </section>
      </div>

      {lightboxItem && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0c1929]/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Pratinjau dokumentasi" onClick={() => setLightboxItem(null)}><button type="button" onClick={() => setLightboxItem(null)} aria-label="Tutup pratinjau" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">×</button><div className="relative h-[min(78vh,760px)] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={lightboxItem.src} alt={lightboxItem.alt} fill sizes="100vw" className="object-contain"/><p className="absolute inset-x-0 -bottom-8 text-center text-sm text-white/85">{lightboxItem.caption ?? lightboxItem.alt}</p></div></div>}
    </main>
  );
}

function MilestoneDetail({ milestone }: { milestone: ConstructionMilestone }) {
  const style = milestoneStyle[milestone.status];
  return (
    <div className="min-h-[360px] rounded-2xl border border-[#e3eaf1] bg-[#fbfcfd] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-lg"><p className="text-xs font-bold text-[#8190a3]">RINCIAN TAHAP</p><h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1d3554]">{milestone.title}</h3><p className="mt-2 text-sm leading-6 text-[#6c7b90]">{milestone.description}</p></div>
        <span className={`inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${style.text} ${style.ring}`}><span className={`h-2 w-2 rounded-full ${style.dot}`} />{style.label}</span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3 ring-1 ring-[#e8edf2]"><dt className="text-xs font-medium text-[#8794a4]">Tanggal mulai</dt><dd className="mt-1 text-sm font-bold text-[#334762]">{dateLabel(milestone.startedAt)}</dd></div><div className="rounded-xl bg-white p-3 ring-1 ring-[#e8edf2]"><dt className="text-xs font-medium text-[#8794a4]">Tanggal selesai</dt><dd className="mt-1 text-sm font-bold text-[#334762]">{dateLabel(milestone.completedAt)}</dd></div></dl>
      <div className="mt-6 border-t border-[#e5ebf1] pt-5"><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-[#334762]">Rincian pekerjaan</h4><span className="text-xs text-[#8996a6]">{milestone.tasks.length} tugas</span></div>
        {milestone.tasks.length ? <ul className="mt-3 divide-y divide-[#e9eef3]">{milestone.tasks.map((task) => <li key={task.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-[#445872]">{task.title}</span><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${task.status === "completed" ? "bg-[#e9f6f1] text-[#0b8068]" : task.status === "in-progress" ? "bg-[#eaf3fc] text-[#145a9d]" : "bg-[#f1f4f7] text-[#738195]"}`}>{task.status === "completed" ? "Selesai" : task.status === "in-progress" ? "Berjalan" : "Menunggu"}</span></li>)}</ul> : <p className="mt-3 rounded-xl bg-white px-4 py-4 text-sm leading-6 text-[#7b899a] ring-1 ring-[#e8edf2]">Rincian pekerjaan pada tahap ini belum diperbarui.</p>}
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8e2eb] bg-[#fafcfd] px-6 py-8 text-center"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#edf4fb] text-lg text-[#58718e]" aria-hidden="true">＋</span><h3 className="mt-3 text-sm font-bold text-[#3e526d]">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[#8290a1]">{description}</p></div>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.82 9.82 0 0 0-8.37 14.96L2 22l5.2-1.63A9.9 9.9 0 1 0 12.04 2Zm0 17.95a8.12 8.12 0 0 1-4.13-1.13l-.3-.18-3.08.97.98-3-.2-.31a8.08 8.08 0 1 1 6.73 3.65Zm4.43-6.05c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.2-1.41-1.34-1.65-.14-.24-.01-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
}
