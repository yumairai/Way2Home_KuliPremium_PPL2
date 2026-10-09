"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/proyek";
import { formatRupiah } from "@/utils/format";
import ActionPanel from "./ActionPanel";
import PaymentsSection from "./PaymentsSection";

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  "Menunggu Verifikasi": { label: "Menunggu", style: "bg-[#fffaf0] text-[#92400e]" },
  "Revisi Dokumen": { label: "Perlu Revisi", style: "bg-[#fef2f2] text-[#991b1b]" },
  "Alokasi Tim": { label: "Mengalokasikan Tim", style: "bg-[#eef5ff] text-[#004796]" },
  "Kontrak Proyek": { label: "Menunggu Kontrak", style: "bg-[#eef5ff] text-[#004796]" },
  "Pembayaran DP": { label: "Menunggu DP", style: "bg-[#eef5ff] text-[#004796]" },
  "Proyek Aktif": { label: "Proyek Aktif", style: "bg-[#ecfdf5] text-[#065f46]" },
  Selesai: { label: "Selesai", style: "bg-[#f1f5f9] text-[#475569]" },
  Dibatalkan: { label: "Dibatalkan", style: "bg-[#fef2f2] text-[#991b1b]" },
};

export default function ProjectDetail({ project }: { project: Project }) {
  const badge = STATUS_BADGE[project.status] ?? { label: project.status, style: "bg-[#f1f5f9] text-[#475569]" };

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[1.5rem] border border-[#dbe4f2] bg-white shadow-[0_12px_30px_rgba(17,30,63,0.06)]">
        <div className="relative aspect-[16/8]">
          <Image
            src={project.image}
            alt={`Desain rumah ${project.designName}`}
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-[#0f172a]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">{project.designName}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {project.address}
            </p>
          </div>
          <span className={`absolute right-5 top-5 rounded-full px-4 py-1.5 text-xs font-bold ${badge.style}`}>
            {badge.label}
          </span>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-3 md:p-8">
          {[
            ["Nama Desain", project.designName],
            ["Budget", formatRupiah(project.budget)],
            ["Estimasi Waktu", `${project.duration} bulan`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">{label}</p>
              <p className="mt-1 text-lg font-bold text-[#111e3f]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <ActionPanel project={project} />

      {(project.status === "Proyek Aktif" || project.status === "Selesai") && (
        <Link
          href={`/proyek/${project.id}/tracking`}
          className="group flex items-center justify-between gap-5 rounded-[1.5rem] border border-[#cfe0f1] bg-[#f3f8fd] p-6 transition-colors hover:bg-[#eaf3fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2]"
        >
          <span>
            <span className="block text-base font-bold text-[#173f68]">Pantau progres pembangunan</span>
            <span className="mt-1 block text-sm text-[#647b91]">Lihat milestone, pembaruan tim, dan dokumentasi proyek.</span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg text-[#045ec2] shadow-sm transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
        </Link>
      )}

      {project.status === "Proyek Aktif" && <PaymentsSection project={project} />}
    </div>
  );
}
