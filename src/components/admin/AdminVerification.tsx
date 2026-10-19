"use client";
import { useEffect, useMemo, useState } from "react";
import {
  type VerificationDocumentStatus,
  type VerificationRequest,
} from "@/data/admin-verification";
import { useDemoRole } from "@/utils/demo-auth";

const statusStyle: Record<VerificationDocumentStatus, string> = {
  Menunggu: "border-[#f0d8a8] bg-[#fff6e7] text-[#9a671f]",
  Disetujui: "border-[#cfe3d2] bg-[#edf7ee] text-[#477c50]",
  Ditolak: "border-[#ebcaca] bg-[#fff0f0] text-[#a75252]",
};
const statusText: Record<VerificationDocumentStatus, string> = {
  Menunggu: "Menunggu",
  Disetujui: "Disetujui",
  Ditolak: "Ditolak",
};
const final = (request: VerificationRequest) =>
  request.documents.every((document) => document.status !== "Menunggu");

function VerificationModal({
  request,
  onClose,
  onSave,
}: {
  request: VerificationRequest;
  onClose: () => void;
  onSave: (updated: VerificationRequest) => Promise<void>;
}) {
  const [documents, setDocuments] = useState(request.documents);
  const [note, setNote] = useState(request.adminNote);
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = documents.filter(
    (document) => document.status === "Menunggu",
  ).length;
  const setDocumentStatus = (id: string, status: VerificationDocumentStatus) =>
    setDocuments((current) =>
      current.map((document) =>
        document.id === id ? { ...document, status } : document,
      ),
    );
  const bulk = (status: VerificationDocumentStatus) =>
    setDocuments((current) =>
      current.map((document) =>
        document.status === "Menunggu" ? { ...document, status } : document,
      ),
    );
  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...request, documents, adminNote: note });
      setSaved(true);
      window.setTimeout(onClose, 850);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan hasil review.");
      setSaving(false);
    }
  };
  const active = documents[selected];
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0c1b2b]/65 p-0 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-modal-title"
        className="flex h-full w-full max-w-[1440px] flex-col overflow-hidden bg-[#f4f6f8] shadow-2xl sm:h-[min(92vh,900px)] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#e7ebef] bg-white px-5 py-4 md:px-7">
          <div>
            <p className="text-[11px] text-slate-500">
              Pengajuan #{request.id} <span className="px-1">/</span>{" "}
              {request.applicant}
            </p>
            <h2
              id="verification-modal-title"
              className="mt-1 text-lg font-bold text-[#17344e]"
            >
              Review dokumen legalitas
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup review"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-xl text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#477ba6]"
          >
            x
          </button>
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[250px_minmax(320px,1fr)_360px] xl:overflow-hidden">
          <aside className="flex flex-col border-b border-[#e4e9ee] bg-white xl:border-b-0 xl:border-r">
            <div className="p-4">
              <p className="text-xs font-bold text-[#243d53]">
                Dokumen pemohon
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Pilih berkas untuk melihat pratinjau.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 px-3 pb-3 xl:block xl:space-y-1 xl:px-2">
              {documents.map((document, index) => (
                <button
                  key={document.id}
                  onClick={() => setSelected(index)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#477ba6] xl:border-transparent ${selected === index ? "border-[#c9d9e6] bg-[#edf4f9] xl:border-[#dce7ef]" : "border-[#ebeff3] hover:bg-slate-50"}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#2a4155]">
                      {document.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusStyle[document.status]}`}
                    >
                      {statusText[document.status]}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[9px] text-slate-400">
                    {document.fileName}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-auto hidden space-y-2 border-t border-[#edf0f3] p-4 xl:block">
              <p className="text-[10px] font-semibold text-slate-500">
                Aksi massal untuk berkas menunggu
              </p>
              <button
                onClick={() => bulk("Ditolak")}
                disabled={!pending}
                className="h-9 w-full rounded-lg border border-[#ead0d0] text-xs font-semibold text-[#9b5555] hover:bg-[#fff6f6] disabled:opacity-40"
              >
                Tolak semua
              </button>
              <button
                onClick={() => bulk("Disetujui")}
                disabled={!pending}
                className="h-9 w-full rounded-lg bg-[#183b57] text-xs font-semibold text-white hover:bg-[#234f70] disabled:opacity-40"
              >
                Verifikasi semua
              </button>
            </div>
          </aside>
          <section className="flex min-h-[440px] flex-col bg-[#e9edf1] p-4 md:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#263d53]">
                  Pratinjau berkas
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {active.fileName}
                </p>
              </div>
            </div>
            <div className="grid min-h-[350px] flex-1 place-items-center overflow-hidden rounded-xl border border-[#d9e0e6] bg-[#dfe4e9] p-3">
              <div className="max-h-full max-w-full overflow-auto rounded-md bg-white shadow-md">
                {active.kind === "pdf" ? (
                  <iframe
                    src={active.dataUrl}
                    title={`Pratinjau ${active.name}`}
                    className="h-[min(58vh,680px)] w-[min(70vw,760px)]"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.dataUrl}
                    alt={`Pratinjau: ${active.name}`}
                    className="block max-h-[min(58vh,680px)] w-auto max-w-full object-contain"
                  />
                )}
              </div>
            </div>
          </section>
          <aside className="space-y-4 border-t border-[#e4e9ee] bg-white p-4 md:p-5 xl:overflow-y-auto xl:border-l xl:border-t-0">
            <section className="overflow-hidden rounded-xl border border-[#e4e9ee]">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <h3 className="text-xs font-bold text-[#263d53]">
                    Rumah yang dipilih
                  </h3>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Dari katalog Way2Home
                  </p>
                </div>
                <span className="rounded-md bg-[#edf3f7] px-2 py-1 text-[9px] font-semibold text-[#557188]">
                  {request.house.style}
                </span>
              </div>
              <div className="relative h-[150px] bg-[#e5eaf0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.house.image}
                  alt={`Desain rumah ${request.house.name}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="text-[15px] font-bold text-[#183b57]">
                  {request.house.name}
                </h4>
                <p className="mt-1 text-[10px] text-slate-500">
                  âŒ– {request.house.location}
                </p>
                <p className="mt-3 text-[10px] leading-5 text-slate-600">
                  {request.house.description}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Detail
                    label="Luas tanah"
                    value={`${request.house.landArea} mÂ²`}
                  />
                  <Detail
                    label="Luas bangunan"
                    value={`${request.house.buildingArea} mÂ²`}
                  />
                  <Detail
                    label="Kamar tidur"
                    value={`${request.house.bedrooms} kamar`}
                  />
                  <Detail
                    label="Lantai"
                    value={`${request.house.floors} lantai`}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#f4f7f9] px-3 py-2">
                  <span className="text-[10px] text-slate-500">
                    Estimasi katalog
                  </span>
                  <b className="text-xs text-[#28465f]">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(request.house.estimatedCost)}
                  </b>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-[#edf4f9] px-3 py-2">
                  <span className="text-[10px] text-slate-600">Budget yang diajukan</span>
                  <b className="text-xs text-[#183b57]">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(request.budget || 0)}
                  </b>
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-[#e4e9ee] p-4">
              <h3 className="text-xs font-bold text-[#263d53]">Pemohon</h3>
              <p className="mt-2 text-xs font-semibold text-slate-700">
                {request.applicant}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">{request.email}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                Diajukan {request.submittedAt}
              </p>
            </section>
          </aside>
        </div>
        <div className="grid shrink-0 gap-3 border-t border-[#e7ebef] bg-white p-4 md:grid-cols-[1fr_auto] md:px-6">
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-semibold text-slate-600">
              Alasan penolakan / catatan admin
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Jelaskan dokumen yang perlu diperbaiki..."
              rows={2}
              className="w-full resize-y rounded-lg border border-[#dfe6ed] px-3 py-2 text-xs outline-none placeholder:text-slate-400 focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15"
            />
          </label>
          <div className="flex flex-wrap items-end justify-end gap-2">
            <button
              onClick={() => setDocumentStatus(active.id, "Ditolak")}
              disabled={active.status !== "Menunggu"}
              className="h-10 rounded-lg border border-[#e7cccc] px-4 text-xs font-semibold text-[#9b5555] hover:bg-[#fff6f6] disabled:opacity-40"
            >
              Tolak berkas ini
            </button>
            <button
              onClick={() => setDocumentStatus(active.id, "Disetujui")}
              disabled={active.status !== "Menunggu"}
              className="h-10 rounded-lg border border-[#d5e1e8] px-4 text-xs font-semibold text-[#315b76] hover:bg-[#f4f8fa] disabled:opacity-40"
            >
              Setujui berkas ini
            </button>
            <button
              onClick={submit}
              disabled={pending > 0 || saved || saving}
              className="h-10 rounded-lg bg-[#183b57] px-5 text-xs font-semibold text-white hover:bg-[#234f70] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saved
                ? "Tersimpan"
                : saving
                  ? "Menyimpan..."
                : pending > 0
                  ? `Tinjau ${pending} dokumen lagi`
                  : "Simpan hasil review"}
            </button>
            {error && <p role="alert" className="w-full text-right text-xs text-[#a75252]">{error}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f5f7f9] px-3 py-2">
      <span className="block text-[9px] text-slate-500">{label}</span>
      <strong className="mt-1 block text-[11px] text-[#334c62]">{value}</strong>
    </div>
  );
}

export default function AdminVerification() {
  const demoRole = useDemoRole();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua status");
  const visibleLoadError = demoRole
    ? "Akun Admin Demo hanya untuk preview UI. Keluar, lalu login dengan akun admin Supabase untuk memuat dan memverifikasi pengajuan customer."
    : loadError;
  const isLoading = loading && !demoRole;

  useEffect(() => {
    if (demoRole) return;

    let active = true;
    fetch("/api/admin/document-verification")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat pengajuan.");
        return result.requests as VerificationRequest[];
      })
      .then((items) => {
        if (active) setRequests(items);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Gagal memuat pengajuan.");
      })
      .finally(() => { 
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [demoRole]);
  const filtered = useMemo(
    () =>
      requests.filter(
        (request) =>
          `${request.id} ${request.applicant} ${request.house.name}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()) &&
          (filter === "Semua status" ||
            (filter === "Menunggu"
              ? !final(request)
              : final(request) &&
                request.documents.some(
                  (document) => document.status === filter,
                ))),
      ),
    [requests, query, filter],
  );
  const count = (status: VerificationDocumentStatus) =>
    requests.reduce(
      (sum, request) =>
        sum +
        request.documents.filter((document) => document.status === status)
          .length,
      0,
    );
  const save = async (updated: VerificationRequest) => {
    const response = await fetch(`/api/admin/document-verification/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisions: updated.documents.map(({ id, status }) => ({ id, status })),
        adminNote: updated.adminNote,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal menyimpan hasil review.");
    setRequests((current) => current.filter((request) => request.id !== updated.id));
  };
  const summaries = [
    {
      label: "Total pengajuan",
      value: requests.length,
      style: "text-[#294c69] bg-[#eaf1f6]",
    },
    {
      label: "Menunggu review",
      value: requests.filter((request) => !final(request)).length,
      style: "text-[#9a671f] bg-[#fff5e3]",
    },
    {
      label: "Dokumen disetujui",
      value: count("Disetujui"),
      style: "text-[#477c50] bg-[#edf7ee]",
    },
    {
      label: "Dokumen ditolak",
      value: count("Ditolak"),
      style: "text-[#a75252] bg-[#fff0f0]",
    },
  ];
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8 xl:p-10">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold text-[#64809a]">
            Administrasi dokumen legal
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#17344e] md:text-[32px]">
            Verifikasi dokumen
          </h1>
          <p className="mt-1 text-sm text-slate-500">
              Periksa dokumen, budget, dan desain yang diajukan customer.
          </p>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaries.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-[#e5eaf0] bg-white p-4 md:p-5"
          >
            <p className="text-[11px] font-medium text-slate-500">
              {item.label}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <strong className="text-2xl text-[#17344e]">{item.value}</strong>
            </div>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#edf0f4] p-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="text-[15px] font-bold text-[#263d53]">
              Pengajuan verifikasi
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Satu pengajuan untuk setiap proyek pembangunan.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label>
              <span className="sr-only">Cari pengajuan</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari ID, pemohon, rumah..."
                className="h-10 w-full rounded-lg border border-[#dfe6ed] px-3 text-xs outline-none focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15 sm:w-[230px]"
              />
            </label>
            <label>
              <span className="sr-only">Filter hasil review</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-10 rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs text-slate-600 outline-none focus:border-[#477ba6]"
              >
                <option>Semua status</option>
                <option>Menunggu</option>
                <option>Disetujui</option>
                <option>Ditolak</option>
              </select>
            </label>
          </div>
        </div>
          {visibleLoadError && (
            <p role="alert" className="border-b border-[#f2d4d4] bg-[#fff6f6] px-6 py-3 text-xs text-[#a75252]">
              {visibleLoadError}
            </p>
          )}
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-[10px] font-semibold text-slate-500">
                <th className="px-5 py-3">ID pengajuan</th>
                <th className="px-4 py-3">Pemohon</th>
                {["Sertifikat tanah", "KTP", "IMB/PBG", "Surat kuasa"].map(
                  (name) => (
                    <th key={name} className="px-3 py-3 text-center">
                      {name}
                    </th>
                  ),
                )}
                <th className="px-4 py-3">Catatan admin</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f4]">
              {filtered.map((request) => {
                const isFinal = final(request);
                const rejected = request.documents.some(
                  (document) => document.status === "Ditolak",
                );
                return (
                  <tr key={request.id} className="hover:bg-[#fbfcfd]">
                    <td className="px-5 py-4 font-semibold text-[#365873]">
                      #{request.id}
                      <span className="mt-1 block text-[9px] font-normal text-slate-400">
                        {request.submittedAt}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="block font-semibold text-slate-700">
                        {request.applicant}
                      </span>
                      <span className="mt-1 block text-[9px] text-slate-400">
                        {request.house.name} Â· {request.house.style}
                      </span>
                    </td>
                    {request.documents.map((document) => (
                      <td key={document.id} className="px-3 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold ${statusStyle[document.status]}`}
                        >
                          {statusText[document.status]}
                        </span>
                      </td>
                    ))}
                    <td className="max-w-[200px] px-4 py-4 text-slate-500">
                      {request.adminNote || "â€”"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isFinal ? (
                        <button
                          disabled
                          className="rounded-lg border border-[#e1e6ea] px-3 py-2 text-[10px] font-semibold text-slate-400"
                        >
                          {rejected ? "Selesai Â· Ditolak" : "Terverifikasi"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="rounded-lg bg-[#183b57] px-4 py-2 text-[10px] font-semibold text-white hover:bg-[#234f70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6]"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !visibleLoadError && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    {requests.length === 0
                      ? "Belum ada pengajuan dokumen untuk diverifikasi."
                      : "Tidak ada pengajuan yang cocok dengan pencarian atau filter."}
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Memuat pengajuan customer...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-[#edf0f4] px-5 py-3 text-[10px] text-slate-400 sm:flex-row sm:justify-between">
          <span>
            Menampilkan {filtered.length} dari {requests.length} pengajuan
          </span>
          <span>Keputusan review tersimpan pada data proyek customer.</span>
        </div>
      </section>
      <p className="text-[10px] leading-5 text-slate-400">
        Daftar hanya menampilkan proyek customer yang masih berada pada tahap
        verifikasi dokumen.
      </p>
      {selectedRequest && (
        <VerificationModal
          key={selectedRequest.id}
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
