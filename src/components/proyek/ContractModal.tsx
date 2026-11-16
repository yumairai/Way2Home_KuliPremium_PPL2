"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Project } from "@/types/proyek";
import { formatDate } from "@/utils/format";
import SignaturePadModal from "@/components/contract/SignaturePadModal";
import ContractDocument from "@/components/contract/ContractDocument";
import SignatureSlot from "@/components/contract/SignatureSlot";

export default function ContractModal({
  project,
  interactive,
  onClose,
}: {
  project: Project;
  interactive: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState(false);
  const [readToBottom, setReadToBottom] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(
    null,
  );
  const [supervisorSignature, setSupervisorSignature] = useState<string | null>(
    null,
  );
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [action, setAction] = useState<"menunggu" | "setuju" | "tolak">(
    "menunggu",
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      // Force restore scroll even if component unmounts quickly
      document.body.style.overflow = previousOverflow || "";
    };
  }, [onClose]);

  const handleScroll = () => {
    const element = scrollAreaRef.current;
    if (!element) return;
    // Toleransi 24px agar user tidak harus presisi di titik terakhir
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 24) {
      setReadToBottom(true);
    }
  };

  useEffect(() => {
    const element = scrollAreaRef.current;
    if (!element) return;
    // Konten pendek (tidak bisa scroll) langsung dianggap terbaca sampai bawah
    if (element.scrollHeight <= element.clientHeight + 24) {
      setReadToBottom(true);
    }
  }, []);

  useEffect(() => {
    const path = project.contract.signedCustomerSignaturePath;
    if (!path) return;
    let active = true;
    const load = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const { data } = await createClient()
        .storage.from("contract-signatures")
        .createSignedUrl(path, 300);
      if (active && data?.signedUrl) setCustomerSignature(data.signedUrl);
    };
    void load();
    return () => {
      active = false;
    };
  }, [project.contract.signedCustomerSignaturePath]);

  useEffect(() => {
    const path = project.contract.signedPengawasSignaturePath;
    if (!path) return;
    let active = true;
    const load = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const { data, error } = await createClient()
        .storage.from("contract-signatures")
        .createSignedUrl(path, 300);
      if (active && data?.signedUrl && !error)
        setSupervisorSignature(data.signedUrl);
    };
    void load();
    return () => {
      active = false;
    };
  }, [project.contract.signedPengawasSignaturePath]);

  async function setuju() {
    setError(null);
    if (!checked) {
      setError("Centang persetujuan setelah membaca kontrak.");
      return;
    }
    if (!signature) {
      setError("Simpan tanda tangan Anda sebelum menyetujui kontrak.");
      return;
    }
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/projects/${project.id}/contract-signature`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signature, consent: checked }),
        },
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message || "Gagal memfinalisasi kontrak.");
      }

      // Close modal and let cleanup run
      onClose();

      // Wait a bit for modal unmount and cleanup to complete
      setTimeout(() => {
        // Force restore scroll just in case
        document.body.style.overflow = "";
        // Then refresh
        router.refresh();
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memfinalisasi kontrak.",
      );
      setSubmitting(false);
    }
  }

  const tolak = () => {
    setAction("tolak");
    setToast("Penolakan Anda telah diteruskan ke tim Way2Home.");
  };

  const paymentPlan =
    project.payments.length > 0
      ? project.payments
      : [
          {
            label: "Uang Muka (DP)",
            amount: Math.round((project.estimatedCost ?? project.budget) * 0.3),
          },
          {
            label: "Termin 1",
            amount: Math.round(
              (project.estimatedCost ?? project.budget) * 0.25,
            ),
          },
          {
            label: "Termin 2",
            amount: Math.round(
              (project.estimatedCost ?? project.budget) * 0.25,
            ),
          },
          {
            label: "Termin 3 (Pelunasan)",
            amount:
              (project.estimatedCost ?? project.budget) -
              Math.round((project.estimatedCost ?? project.budget) * 0.3) -
              Math.round((project.estimatedCost ?? project.budget) * 0.25) * 2,
          },
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="contract-modal relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_40px_80px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-[#edf1f6] px-8 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#111e3f]">Kontrak Proyek</h2>
            <p className="mt-1 text-xs text-[#64748b]">{project.contract.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kontrak"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#dbe4f2] text-[#475569] transition hover:bg-[#f1f5f9] active:scale-90"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="contract-print-area overflow-y-auto px-8 py-6 md:px-12"
        >
          <div className="text-center">
            <Image
              src="/images/aset/logo-w2h.png"
              alt="Logo Way2Home"
              width={60}
              height={60}
              className="mx-auto h-20 w-auto object-contain"
            />
            <p className="mt-3 text-sm font-bold tracking-wide text-[#004796]">
              SURAT PERJANJIAN KERJA SAMA PEMBANGUNAN RUMAH
            </p>
            <p className="mt-1 text-xs text-[#64748b]">
              Nomor: {project.contract.id} · Hari / Tanggal:{" "}
              {formatDate(project.contract.issuedAt)}
            </p>
          </div>

          <ContractDocument
            contractNumber={project.contract.id}
            contractDate={formatDate(project.contract.issuedAt)}
            customerName={project.customerName || "Customer"}
            customerNik={project.customerNik || "Belum tersedia"}
            customerPhone={project.customerPhone || "Belum tersedia"}
            customerEmail={project.customerEmail || "Belum tersedia"}
            projectCode={String(project.id)}
            address={project.address}
            designName={project.designName}
            architecturalStyle={project.style}
            landArea={project.landArea}
            buildingArea={project.buildingArea}
            floors={project.floors}
            bedrooms={project.bedrooms}
            bathrooms={project.bathrooms}
            value={project.estimatedCost ?? project.budget}
            duration={project.duration}
            startDate={
              project.contract.startAt
                ? formatDate(project.contract.startAt)
                : "Belum ditentukan"
            }
            completionDate={
              project.contract.estimatedCompletionAt
                ? formatDate(project.contract.estimatedCompletionAt)
                : "Belum ditentukan"
            }
            scope={project.scope}
            supervisor={
              project.team.find((member) => member.role === "Pengawas")?.name ||
              "Belum ditugaskan"
            }
            foremen={project.team
              .filter((member) => member.role === "Mandor")
              .map((member) => member.name)}
            paymentStages={paymentPlan.map((payment) => ({
              label: payment.label,
              amount: payment.amount,
            }))}
          />

          <div className="mt-10 rounded-2xl border border-[#dbe4f2] bg-[#f7f9fc] p-5">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#64748b]">
              Tanda Tangan Para Pihak
            </p>

            <div className="mx-auto mt-6 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
              {/* Penyedia Jasa */}
              <SignatureSlot
                role="Director of Way2Home"
                name="PT Way2Home Konstruksi"
              >
                <Image
                  src="/images/signature-w2h.png"
                  alt="Tanda tangan PT Way2Home Konstruksi"
                  width={220}
                  height={90}
                  unoptimized
                  className="h-[72px] w-[180px] object-contain object-center"
                />
              </SignatureSlot>

              {/* Pengawas */}
              <SignatureSlot
                role="Pengawas"
                name={
                  project.team.find((member) => member.role === "Pengawas")
                    ?.name || "Pengawas proyek"
                }
              >
                {supervisorSignature ? (
                  <img
                    src={supervisorSignature}
                    alt="Tanda tangan pengawas"
                    className="h-[72px] max-w-full object-contain"
                  />
                ) : (
                  <span className="pb-6 text-xs text-amber-800">
                    Menunggu tanda tangan
                  </span>
                )}
              </SignatureSlot>

              {/* Customer */}
              <SignatureSlot
                role="Customer"
                name={project.customerName || "Customer"}
              >
                {signature || customerSignature ? (
                  <img
                    src={signature || customerSignature || ""}
                    alt="Tanda tangan customer"
                    className="h-[72px] max-w-full object-contain"
                  />
                ) : (
                  <span className="pb-6 text-xs text-slate-500">
                    Tanda tangan customer
                  </span>
                )}
              </SignatureSlot>
            </div>
          </div>
        </div>

        {interactive &&
          action === "menunggu" &&
          !project.contract.signedCustomerAt && (
            <div className="no-print border-t border-[#edf1f6] bg-white px-8 py-5">
              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#991b1b]"
                >
                  {error}
                </p>
              )}
              {!project.contract.signedPengawasSignaturePath ? (
                <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Kontrak menunggu tanda tangan pengawas. Anda dapat melihat
                  kontrak, tetapi belum dapat menyimpan tanda tangan atau
                  menyetujuinya.
                </p>
              ) : (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!readToBottom) {
                        setError(
                          "Silakan scroll dan baca ketentuan kontrak sampai bawah sebelum melakukan tanda tangan dan finalisasi.",
                        );
                        return;
                      }
                      setError(null);
                      setSignatureOpen(true);
                    }}
                    disabled={submitting}
                    className="min-h-11 rounded-lg border border-[#183b57] px-5 text-sm font-semibold text-[#183b57] hover:bg-slate-50"
                  >
                    {signature
                      ? "Gambar ulang tanda tangan"
                      : "Tanda tangan kontrak"}
                  </button>
                  {signature && (
                    <span className="text-sm font-semibold text-emerald-800">
                      Tanda tangan berhasil dibuat
                    </span>
                  )}
                </div>
              )}
              <label
                className={`flex items-start gap-3 ${!project.contract.signedPengawasSignaturePath ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={
                    submitting || !project.contract.signedPengawasSignaturePath
                  }
                  onChange={(event) => {
                    setChecked(event.target.checked);
                    setError(null);
                  }}
                  className="mt-0.5 h-5 w-5 cursor-pointer accent-[#004796]"
                />
                <span className="text-sm leading-6 text-[#334155]">
                  Saya telah membaca dan memahami seluruh isi kontrak, termasuk
                  ruang lingkup pekerjaan, nilai proyek, dan ketentuan yang
                  berlaku.
                </span>
              </label>

              {rejectMode ? (
                <div className="mt-4">
                  <textarea
                    value={reason}
                    disabled={submitting}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setError(null);
                    }}
                    rows={3}
                    placeholder="Jelaskan alasan Anda menolak kontrak ini"
                    className="w-full resize-y rounded-xl border border-[#dbe4f2] px-4 py-3 text-sm outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={!checked || !reason.trim() || submitting}
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
                    disabled={
                      !checked ||
                      !signature ||
                      !project.contract.signedPengawasSignaturePath ||
                      submitting
                    }
                    onClick={setuju}
                    className="min-h-12 cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan persetujuan..." : "Setuju"}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setRejectMode(true)}
                    className="min-h-12 cursor-pointer rounded-full border-2 border-[#dc2626] px-8 font-bold text-[#dc2626] transition hover:bg-[#fef2f2]"
                  >
                    Tolak Kontrak
                  </button>
                </div>
              )}
            </div>
          )}

        {(!interactive || project.contract.signedCustomerAt) && (
          <div className="no-print flex justify-end gap-3 border-t border-[#edf1f6] bg-white px-8 py-5">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full border border-[#dbe4f2] px-6 py-3 text-sm font-bold text-[#475569] transition hover:bg-[#f1f5f9]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
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

        {signatureOpen && (
          <SignaturePadModal
            onClose={() => setSignatureOpen(false)}
            busy={signatureLoading}
            onContinue={async (data) => {
              setSignatureLoading(true);
              setSignature(data);
              setSignatureOpen(false);
              setSignatureLoading(false);
            }}
          />
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
