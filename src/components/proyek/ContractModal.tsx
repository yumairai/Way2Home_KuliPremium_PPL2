"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Project } from "@/types/proyek";
import { formatDate, formatRupiah } from "@/utils/format";

const KETENTUAN = [
  "Pihak Kedua tidak dapat mengubah desain atau spesifikasi material setelah kontrak ditandatangani tanpa persetujuan tertulis dari pihak Way2Home.",
  "Keterlambatan pembayaran sesuai tahapan akan mengakibatkan penundaan sementara pengerjaan proyek.",
  "Pihak Way2Home berhak melakukan penyesuaian jadwal apabila terjadi kondisi cuaca ekstrem atau force majeure.",
  "Segala bentuk pengurusan perizinan (IMB/PBG) berada di luar cakupan layanan platform Way2Home.",
  "Garansi pekerjaan berlaku 3 bulan setelah serah terima, tidak termasuk kerusakan akibat penyalahgunaan.",
  "Pembatalan proyek setelah kontrak ditandatangani akan dikenakan ketentuan pengembalian dana sesuai kebijakan yang berlaku.",
];

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="flex items-center gap-3 text-lg font-bold text-[#111e3f]">
        <span className="h-7 w-1.5 rounded-full bg-[#004796]" />
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-[#eef2f7] py-3 last:border-0">
      <span className="text-sm text-[#64748b]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#111e3f]">{value}</span>
    </div>
  );
}

function DataTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-[#dbe4f2] bg-[#f7f9fc] px-5 py-1">
      {rows.map(([label, value]) => (
        <DataRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}

export default function ContractModal({
  project,
  interactive,
  onClose,
}: {
  project: Project;
  interactive: boolean;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [action, setAction] = useState<"menunggu" | "setuju" | "tolak">("menunggu");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const setuju = () => {
    setAction("setuju");
    setToast("Kontrak berhasil ditandatangani. Silakan lakukan pembayaran Down Payment.");
  };

  const tolak = () => {
    setAction("tolak");
    setToast("Penolakan Anda telah diteruskan ke tim Way2Home.");
  };

  const sumPayments = project.payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_40px_80px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-[#edf1f6] px-8 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#111e3f]">Kontrak Proyek</h2>
            <p className="mt-1 text-xs text-[#64748b]">
              {project.contract.id} · Versi {project.contract.version}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kontrak"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#dbe4f2] text-[#475569] transition hover:bg-[#f1f5f9] active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-8 py-6 md:px-12">
          <div className="text-center">
            <Image
              src="/images/aset/logo-w2h.png"
              alt="Logo Way2Home"
              width={60}
              height={60}
              className="mx-auto h-20 w-auto object-contain"
            />
            <p className="mt-3 text-sm font-bold tracking-wide text-[#004796]">KONTRAK PEMBANGUNAN RUMAH</p>
            <p className="mt-1 text-xs text-[#64748b]">
              Nomor: {project.contract.id} · Terbit: {formatDate(project.contract.issuedAt)}
            </p>
          </div>

          <DocSection title="Para Pihak">
            <DataTable
              rows={[
                ["Pihak Pertama", "PT Way2Home Konstruksi"],
                ["Pihak Kedua", "Budi Santoso"],
                ["Alamat Proyek", project.address],
              ]}
            />
          </DocSection>

          <DocSection title="Data Proyek">
            <DataTable
              rows={[
                ["Tipe Rumah", project.designName],
                ["Gaya Arsitektur", project.style],
                ["Lokasi", project.location],
                ["Area (Tanah/Bangunan)", `${project.landArea} m² / ${project.buildingArea} m²`],
                ["Nilai Proyek", formatRupiah(project.budget)],
                ["Durasi", `${project.duration} bulan`],
              ]}
            />
          </DocSection>

          <DocSection title="Ruang Lingkup Pekerjaan">
            <ol className="space-y-2.5">
              {project.scope.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-[#334155]">
                  <span className="font-bold text-[#004796]">{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
          </DocSection>

          <DocSection title="Tahapan Pembayaran">
            <DataTable
              rows={project.payments.map((p) => [p.label, formatRupiah(p.amount)])}
            />
            <p className="mt-3 text-xs text-[#64748b]">
              Total nilai proyek: <span className="font-bold text-[#111e3f]">{formatRupiah(sumPayments)}</span>. Down Payment dibayarkan dalam 7×24 jam setelah kontrak ditandatangani.
            </p>
          </DocSection>

          <DocSection title="Tim Pelaksana">
            <div className="grid gap-4 sm:grid-cols-2">
              {project.team.map((member) => (
                <div key={member.id} className="rounded-2xl border border-[#dbe4f2] bg-[#f7f9fc] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef5ff] font-bold text-[#004796]">
                      {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111e3f]">{member.name}</p>
                      <p className="text-xs font-semibold text-[#045ec2]">{member.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-[#64748b]">
                    <p>Pengalaman: {member.experience}</p>
                    <p>{member.projects} proyek selesai</p>
                    <p>{member.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection title="Ketentuan Proyek">
            <ol className="space-y-3">
              {KETENTUAN.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-[#334155]">
                  <span className="font-bold text-[#004796]">{index + 1}.</span>
                  {item}
                </li>
              ))}
            </ol>
          </DocSection>

          <div className="mt-10 rounded-2xl border border-[#dbe4f2] bg-[#f7f9fc] p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Tanda Tangan</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-[#111e3f]">Pihak Pertama</p>
                <p className="mt-1 text-xs text-[#64748b]">PT Way2Home Konstruksi</p>
              </div>
              <div>
                <p className="text-sm font-bold text-[#111e3f]">Pihak Kedua</p>
                <p className="mt-1 text-xs text-[#64748b]">Budi Santoso</p>
              </div>
            </div>
          </div>
        </div>

        {interactive && action === "menunggu" && (
          <div className="border-t border-[#edf1f6] bg-white px-8 py-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
                className="mt-0.5 h-5 w-5 cursor-pointer accent-[#004796]"
              />
              <span className="text-sm leading-6 text-[#334155]">
                Saya telah membaca dan memahami seluruh isi kontrak, termasuk ruang lingkup pekerjaan, nilai proyek, dan ketentuan yang berlaku.
              </span>
            </label>

            {rejectMode ? (
              <div className="mt-4">
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder="Jelaskan alasan Anda menolak kontrak ini"
                  className="w-full resize-y rounded-xl border border-[#dbe4f2] px-4 py-3 text-sm outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!checked || !reason.trim()}
                    onClick={tolak}
                    className="min-h-12 cursor-pointer rounded-full bg-[#dc2626] px-8 font-bold text-white shadow-lg transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Kirim Penolakan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectMode(false)}
                    className="min-h-12 cursor-pointer rounded-full border border-[#dbe4f2] px-8 font-bold text-[#475569] transition hover:bg-[#f1f5f9]"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!checked}
                  onClick={setuju}
                  className="min-h-12 cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Setuju & Tandatangani
                </button>
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  className="min-h-12 cursor-pointer rounded-full border-2 border-[#dc2626] px-8 font-bold text-[#dc2626] transition hover:bg-[#fef2f2]"
                >
                  Tolak Kontrak
                </button>
              </div>
            )}
          </div>
        )}

        {!interactive && (
          <div className="flex justify-end gap-3 border-t border-[#edf1f6] bg-white px-8 py-5">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full border border-[#dbe4f2] px-6 py-3 text-sm font-bold text-[#475569] transition hover:bg-[#f1f5f9]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
                <path d="M6 5h12" />
                <path d="M6 17v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" />
              </svg>
              Download / Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#111e3f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1e293b]"
            >
              Tutup
            </button>
          </div>
        )}

        {toast && (
          <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 rounded-2xl bg-[#059669] px-6 py-4 text-sm font-bold text-white shadow-xl">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
