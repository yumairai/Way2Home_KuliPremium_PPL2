"use client";

import { useState } from "react";
import type { ContractStatus, Project, ProjectStatus } from "@/types/proyek";
import { formatDate } from "@/utils/format";
import ContractModal from "./ContractModal";

const M = [
  { key: "pengajuan", label: "Pengajuan" },
  { key: "verifikasi", label: "Verifikasi Dokumen" },
  { key: "tim", label: "Alokasi Mandor & Pengawas" },
  { key: "kontrak", label: "Kontrak Proyek" },
  { key: "dp", label: "Pembayaran DP" },
  { key: "aktif", label: "Proyek Aktif" },
  { key: "selesai", label: "Proyek Selesai" },
] as const;

type MilestoneKey = (typeof M)[number]["key"];

type Step =
  | { state: "completed"; label: string }
  | { state: "active"; label: string }
  | { state: "pending"; label: string };

function getMilestone(
  project: Project,
): Record<MilestoneKey, Step> {
  const docApproved = project.documentStatus === "approved";
  const teamAssigned = project.team.length > 0;
  const dpPaid = project.payments.find((p) => p.periode === 0)?.status === "lunas";
  const contractAgreed = project.contract.status === "disetujui";
  const finished = project.status === "Selesai";
  const canceled = project.status === "Dibatalkan";

  const isCompleted = (statuses: ProjectStatus[]) => statuses.includes(project.status);

  const step = (state: Step["state"], label: string): Step => ({ state, label });

  if (canceled) {
    return {
      pengajuan: step("completed", formatDate(project.submittedAt)),
      verifikasi: step("completed", "Proyek dibatalkan"),
      tim: step("pending", "Tidak dilanjutkan"),
      kontrak: step("pending", "Tidak dilanjutkan"),
      dp: step("pending", "Tidak dilanjutkan"),
      aktif: step("pending", "Tidak dilanjutkan"),
      selesai: step("pending", "Tidak dilanjutkan"),
    };
  }

  if (finished) {
    return {
      pengajuan: step("completed", formatDate(project.submittedAt)),
      verifikasi: step("completed", "Berhasil direview"),
      tim: step("completed", "Tim dialokasikan"),
      kontrak: step("completed", "Kontrak disetujui"),
      dp: step("completed", "DP lunas"),
      aktif: step("completed", "Pengerjaan selesai"),
      selesai: step("completed", "Dokumentasi tersedia"),
    };
  }

  if (isCompleted(["Proyek Aktif"])) {
    return {
      pengajuan: step("completed", formatDate(project.submittedAt)),
      verifikasi: step("completed", "Berhasil direview"),
      tim: step("completed", "Tim dialokasikan"),
      kontrak: step("completed", "Kontrak disetujui"),
      dp: step("completed", "DP lunas"),
      aktif: step("active", "Pantau progress proyek Anda"),
      selesai: step("pending", "Belum dimulai"),
    };
  }

  return {
    pengajuan: step("completed", formatDate(project.submittedAt)),
    verifikasi: docApproved
      ? step("completed", "Berhasil direview")
      : step("active", project.documentStatus === "revision" ? "Butuh revisi" : "Menunggu review"),
    tim: teamAssigned
      ? step("completed", "Mandor dialokasikan")
      : docApproved
        ? step("active", "Menunggu alokasi")
        : step("pending", "Menunggu"),
    kontrak: !teamAssigned
      ? step("pending", "Menunggu")
      : contractAgreed
        ? step("completed", "Kontrak disetujui")
        : step("active", "Menunggu tanda tangan"),
    dp: dpPaid
      ? step("completed", "DP lunas")
      : contractAgreed
        ? step("active", "Menunggu pembayaran")
        : step("pending", "Menunggu kontrak"),
    aktif: step("pending", "Belum dimulai"),
    selesai: step("pending", "Belum dimulai"),
  };
}

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  menunggu: "Menunggu Tanda Tangan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  revisi: "Dalam Revisi",
  kedaluwarsa: "Kedaluwarsa",
};

const CONTRACT_STATUS_STYLE: Record<ContractStatus, string> = {
  menunggu: "bg-[#eef5ff] text-[#004796] border-[#8fb9ed]",
  disetujui: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
  ditolak: "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
  revisi: "bg-[#fffaf0] text-[#92400e] border-[#fcd47c]",
  kedaluwarsa: "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]",
};

function MilestoneIcon({
  state,
  final,
  children,
}: {
  state: Step["state"];
  final?: boolean;
  children: React.ReactNode;
}) {
  const style =
    state === "completed"
      ? "bg-[#059669] text-white"
      : state === "active"
        ? "bg-[#eef5ff] text-[#004796] ring-2 ring-[#045ec2]"
        : "bg-[#f1f5f9] text-[#94a3b8]";

  return (
    <div className="flex flex-col items-center">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${style}`}>
        {children}
      </div>
      {!final && <div className={`mt-1 w-px flex-1 ${state === "completed" ? "bg-[#059669]" : "bg-[#e2e8f0]"}`} />}
    </div>
  );
}

const iconFor = (key: MilestoneKey) => {
  switch (key) {
    case "pengajuan":
      return <path d="M3 10h11m5 0-5-5m5 5-5 5M3 20h11m5 0-5-5m5 5 5-5" />;
    case "verifikasi":
      return <path d="m16 10 1 1-5 5-3-3m8-4V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M3 18v-3m0 3h3m-3-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" />;
    case "tim":
      return (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    case "kontrak":
      return <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />;
    case "dp":
      return <path d="M12 21a9 9 0 1 1 9-9" />;
    case "aktif":
      return <path d="m3 12 6-6 6 6-6 6z" />;
    case "selesai":
      return <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />;
  }
};

export default function MilestoneSidebar({ project }: { project: Project }) {
  const [contractOpen, setContractOpen] = useState(false);
  const milestones = getMilestone(project);
  const contractStatus = project.contract.status;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[1.5rem] border border-[#dbe4f2] bg-white p-6 shadow-[0_12px_30px_rgba(17,30,63,0.06)]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#475569]">Milestone Proyek</h2>
        <div className="mt-6 flex flex-col">
          {M.map(({ key, label }, index) => {
            const step = milestones[key];
            return (
              <div key={key} className="flex gap-4">
                <MilestoneIcon state={step.state} final={index === M.length - 1}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {iconFor(key)}
                  </svg>
                </MilestoneIcon>
                <div className={`pb-7 ${step.state === "pending" ? "opacity-55" : ""}`}>
                  <p className="text-sm font-bold text-[#111e3f]">{label}</p>
                  <p
                    className={`mt-1 text-xs ${step.state === "active" ? "font-semibold text-[#004796]" : "text-[#64748b]"
                      }`}
                  >
                    {step.label}
                  </p>
                  {key === "kontrak" && step.state === "active" && (
                    <p className={`mt-2 inline-block rounded-full border px-3 py-1 text-[11px] font-bold ${CONTRACT_STATUS_STYLE[contractStatus]}`}>
                      {CONTRACT_STATUS_LABEL[contractStatus]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(contractStatus === "disetujui" || contractStatus === "ditolak" || contractStatus === "revisi") && (
        <button
          type="button"
          onClick={() => setContractOpen(true)}
          className="flex items-center justify-center gap-3 rounded-full border border-[#dbe4f2] bg-white px-6 py-4 text-sm font-bold text-[#004796] transition hover:-translate-y-0.5 hover:border-[#8fb9ed] hover:shadow-lg active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Lihat Kontrak
        </button>
      )}

      <div className="rounded-[1.5rem] bg-gradient-to-br from-[#004796] to-[#045ec2] p-6 text-white shadow-[0_16px_36px_rgba(0,71,150,0.35)]">
        <div className="flex items-center gap-2 text-sm font-bold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
            <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
          Butuh Bantuan?
        </div>
        <p className="mt-2 text-sm text-white/80">Tim kami siap membantu Anda di setiap tahap proyek.</p>
        <a
          href="#"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/25"
        >
          Hubungi Admin Kami
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </a>
      </div>

      {contractOpen && <ContractModal project={project} interactive={false} onClose={() => setContractOpen(false)} />}
    </div>
  );
}
