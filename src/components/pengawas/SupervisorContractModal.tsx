"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SignaturePadModal from "@/components/contract/SignaturePadModal";
import ContractDocument from "@/components/contract/ContractDocument";
import SignatureSlot from "@/components/contract/SignatureSlot";
import type { SupervisorProject } from "@/data/pengawas";

export default function SupervisorContractModal({
  project,
  onClose,
}: {
  project: SupervisorProject;
  onClose: () => void;
}) {
  const router = useRouter();
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedImage, setSignedImage] = useState<string | null>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  useEffect(() => {
    const path = project.supervisorSignaturePath;
    if (!path) return;
    let active = true;
    const load = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const { data } = await createClient().storage.from("contract-signatures").createSignedUrl(path, 300);
      if (active && data?.signedUrl) setSignedImage(data.signedUrl);
    };
    void load();
    return () => { active = false; };
  }, [project.supervisorSignaturePath]);

  const paymentStages =
    project.payments.length > 0
      ? project.payments.map((payment) => ({
        label: payment.stage,
        amount: payment.amount,
      }))
      : [
        { label: "Uang Muka (DP)", amount: Math.round(project.value * 0.3) },
        { label: "Termin 1", amount: Math.round(project.value * 0.25) },
        { label: "Termin 2", amount: Math.round(project.value * 0.25) },
        {
          label: "Termin 3 (Pelunasan)",
          amount:
            project.value -
            Math.round(project.value * 0.3) -
            Math.round(project.value * 0.25) * 2,
        },
      ];
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supervisor-contract-title"
    >
      <button
        className="absolute inset-0 bg-[#0c1b2b]/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Tutup kontrak"
      />
      <section className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#e7ebef] px-5 py-4 md:px-7">
          <div>
            <h2
              id="supervisor-contract-title"
              className="text-lg font-bold text-[#17344e]"
            >
              Kontrak proyek
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {project.contractId} � {project.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kontrak"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg text-slate-500 hover:bg-slate-50"
          >
            �
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-6 md:px-10">
          <div className="text-center">
            <Image
              src="/images/aset/logo-w2h.png"
              alt="Way2Home"
              width={52}
              height={52}
              className="mx-auto h-14 w-auto object-contain"
            />
            <p className="mt-3 text-sm font-bold text-[#234b69]">
              SURAT PERJANJIAN KERJA SAMA PEMBANGUNAN RUMAH
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Nomor: {project.contractId} · Hari / Tanggal:{" "}
              {project.contractIssuedAt || "Belum tersedia"}
            </p>
          </div>
          <ContractDocument
            contractNumber={project.contractId}
            contractDate={project.contractIssuedAt || "Belum tersedia"}
            customerName={project.customer}
            customerNik={project.customerNik || "Belum tersedia"}
            customerPhone={project.customerPhone || "Belum tersedia"}
            projectCode={project.id}
            address={project.address}
            designName={project.title}
            architecturalStyle={project.architecturalStyle || "Belum tercantum"}
            landArea={project.landArea ?? 0}
            buildingArea={project.buildingArea ?? 0}
            floors={project.floors}
            bedrooms={project.bedrooms}
            bathrooms={project.bathrooms}
            value={project.value}
            duration={project.duration ?? 0}
            startDate={project.started}
            completionDate={project.deadline}
            scope={[]}
            specifications={[
              ...project.specifications.filter((spec) => !spec.startsWith("Kontrak")),
              `Kebutuhan customer: ${project.needs}`,
            ]}
            supervisor={project.supervisor}
            foremen={project.foremen ?? (project.foreman ? [project.foreman] : [])}
            paymentStages={paymentStages}
          />
          <div className="mt-10 rounded-xl border border-[#e3e9ee] bg-[#fafbfc] p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanda Tangan Para Pihak</p>
            <div className="mx-auto mt-5 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
              <SignatureSlot role="Pihak Pertama" name="PT Way2Home Konstruksi">
                <Image
                  src="/images/signature-w2h.png"
                  alt="Tanda tangan PT Way2Home Konstruksi"
                  width={220}
                  height={90}
                  unoptimized
                  className="h-[72px] w-[180px] object-contain object-center"
                />
              </SignatureSlot>
              <SignatureSlot role="Pengawas" name={project.supervisor}>
                {signedImage ? (
                  <img
                    src={signedImage}
                    alt="Tanda tangan pengawas"
                    className="h-[72px] max-w-full object-contain"
                  />
                ) : (
                  <span className="pb-6 text-xs text-slate-500">
                    Menunggu tanda tangan
                  </span>
                )}
              </SignatureSlot>
              <div className="sm:col-span-2 sm:mx-auto sm:w-1/2">
                <SignatureSlot
                  role="Customer"
                  name={project.customer}
                >
                  {project.customerSignaturePath ? (
                    <span className="pb-6 text-xs text-slate-500">
                      Tanda tangan customer akan tampil setelah kontrak disetujui.
                    </span>
                  ) : (
                    <span className="pb-6 text-xs text-slate-500">
                      Menunggu tanda tangan customer
                    </span>
                  )}
                </SignatureSlot>
              </div>
            </div>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ebef] bg-[#fafbfc] px-5 py-4">
          {error && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
          <div className="flex gap-2"><button type="button" onClick={() => window.print()} className="h-10 rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700">Unduh / Cetak PDF</button><button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-xs font-semibold text-slate-600">Tutup</button></div>
          {!project.supervisorSignedAt && project.projectStageStatus === "finalisasi_kontrak" && <button type="button" disabled={project.contractStatus !== "draft" || saving || (project.foremen ?? []).length === 0} onClick={() => setSignatureOpen(true)} className="h-10 rounded-lg bg-[#183b57] px-5 text-xs font-semibold text-white hover:bg-[#234f70] disabled:cursor-not-allowed disabled:opacity-50">Tanda tangani sebagai pengawas</button>}
          {!project.supervisorSignedAt && project.projectStageStatus !== "finalisasi_kontrak" && <p className="text-xs text-amber-800">Tanda tangan tersedia setelah alokasi mandor difinalisasi.</p>}
          {!project.supervisorSignedAt && project.projectStageStatus === "finalisasi_kontrak" && (project.foremen ?? []).length === 0 && <p className="text-xs text-amber-800">Alokasikan minimal satu mandor sebelum menandatangani.</p>}
          {project.supervisorSignedAt && <p className="text-xs font-semibold text-emerald-800">Tanda tangan pengawas tersimpan</p>}
        </footer>
        {signatureOpen && <SignaturePadModal busy={saving} onClose={() => setSignatureOpen(false)} onContinue={async (signature) => {
          setSaving(true); setError(null);
          try {
            const response = await fetch(`/api/pengawas/projects/${project.id}/contract-signature`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature }) });
            const result = await response.json() as { message?: string };
            if (!response.ok) throw new Error(result.message || "Gagal menyimpan tanda tangan.");
            setSignatureOpen(false); router.refresh();
          } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan tanda tangan."); }
          finally { setSaving(false); }
        }} />}

      </section>
    </div>
  );
}
