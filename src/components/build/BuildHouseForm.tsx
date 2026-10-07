"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type BuildDocumentField = {
  id: string;
  title: string;
  subtitle: string;
  required: boolean;
};

type DocumentFile = {
  name: string;
  size: number;
  type: string;
  preview: string | null;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function UploadField({
  field,
  state,
  onChange,
  onError,
}: {
  field: BuildDocumentField;
  state: DocumentFile | null;
  onChange: (file: DocumentFile | null) => void;
  onError: (id: string, message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      onError(field.id, "Ukuran file melebihi 2MB.");
      onChange(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError(field.id, "Format file harus JPG, PNG, atau PDF.");
      onChange(null);
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () =>
        onChange({ name: file.name, size: file.size, type: file.type, preview: String(reader.result) });
      reader.readAsDataURL(file);
    } else {
      onChange({ name: file.name, size: file.size, type: file.type, preview: null });
    }

    onError(field.id, "");
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) readFile(file);
  };

  return (
    <label
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging
        ? "border-[#045ec2] bg-[#eef5ff]"
        : state
          ? "border-[#059669] bg-[#ecfdf5]"
          : "border-[#dbe4f2] bg-white hover:border-[#8fb9ed]"
        }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) readFile(file);
        }}
      />

      {state?.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={state.preview} alt={`Pratinjau ${field.title}`} className="max-h-24 max-w-24 rounded-xl object-cover" />
      ) : state ? (
        <div className="text-4xl">📄</div>
      ) : (
        <div className="text-4xl opacity-70">📁</div>
      )}

      <p className="font-bold text-[#111e3f]">{field.title}</p>
      <p className={`text-xs ${state ? "font-semibold text-[#059669]" : "text-[#64748b]"}`}>
        {state ? state.name : field.subtitle}
      </p>
      {state && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            if (inputRef.current) inputRef.current.value = "";
            onChange(null);
            onError(field.id, "");
          }}
          className="mt-1 cursor-pointer rounded-full border border-[#dbe4f2] px-3 py-1 text-xs font-semibold text-[#475569] transition hover:bg-[#f1f5f9]"
        >
          Hapus file
        </button>
      )}
    </label>
  );
}

export default function BuildHouseForm({
  design,
}: {
  design: {
    name: string;
    style: string;
    location: string;
    landArea: number;
    buildingArea: number;
    estimatedCost: number;
    estimatedDuration: number;
    image: string;
  };
}) {
  const [address, setAddress] = useState("");
  const [documents, setDocuments] = useState<Record<string, DocumentFile | null>>({
    sertifikat_tanah: null,
    ktp_pemilik: null,
    imb_pbg: null,
    surat_kuasa: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const documentFields: BuildDocumentField[] = [
    { id: "sertifikat_tanah", title: "Sertifikat Tanah (SHM/HGB)", subtitle: "Pilih file atau drag & drop", required: true },
    { id: "ktp_pemilik", title: "KTP Pemilik", subtitle: "Pilih file atau drag & drop", required: true },
    { id: "imb_pbg", title: "IMB/PBG", subtitle: "Pilih file atau drag & drop", required: true },
    { id: "surat_kuasa", title: "Surat Kuasa (Jika Ada)", subtitle: "Pilih file atau drag & drop", required: false },
  ];

  const requiredMissing = documentFields
    .filter((field) => field.required && !documents[field.id])
    .map((field) => field.title);
  const addressMissing = !address.trim();

  const handleSubmit = () => {
    setSubmitAttempted(true);

    if (addressMissing) {
      setErrors((prev) => ({ ...prev, alamat: "Alamat lengkap proyek wajib diisi." }));
    } else {
      setErrors((prev) => ({ ...prev, alamat: "" }));
    }

    requiredMissing.forEach((title) =>
      setErrors((prev) => ({ ...prev, [title]: `${title} wajib diisi.` })),
    );

    if (addressMissing || requiredMissing.length > 0) {
      setNotification({ type: "error", text: "Lengkapi data yang wajib diisi terlebih dahulu." });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setNotification({ type: "success", text: "Pengajuan berhasil. Tim spesialis kami akan menghubungi Anda dalam 1x24 jam." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1200);
  };

  const money = (value: number) => `Rp ${(value / 1000000).toLocaleString("id-ID")} juta`;

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 pt-32 text-[#111e3f]">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold tracking-wide text-[#045ec2]">Form Pembangunan Rumah</p>
          <h1 className="text-3xl font-bold leading-tight tracking-[-0.03em] md:text-5xl">Lengkapi detail proyek Anda</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#64748b]">
            Mulai proses pembangunan profesional bersama Way2Home dengan data proyek yang akurat.
          </p>
        </div>

        {notification && (
          <div
            role="status"
            className={`mt-8 rounded-2xl border p-4 text-sm font-semibold ${notification.type === "success"
              ? "border-[#059669] bg-[#ecfdf5] text-[#065f46]"
              : "border-[#dc2626] bg-[#fef2f2] text-[#991b1b]"
              }`}
          >
            {notification.text}
          </div>
        )}

        {submitted && (
          <div className="mt-8 rounded-3xl border border-[#dbe4f2] bg-white p-8 text-center shadow-sm">
            <h2 className="mt-4 text-2xl font-bold">Pengajuan Terkirim</h2>
            <p className="mt-3 text-[#64748b]">
              Terima kasih. Tim spesialis kami akan menghubungi Anda dalam 1x24 jam setelah verifikasi dokumen.
            </p>
          </div>
        )}

        <section className="mt-10 overflow-hidden rounded-3xl border border-[#dbe4f2] bg-white shadow-[0_12px_30px_rgba(17,30,63,0.06)]">
          <div className="relative aspect-[16/9]">
            <Image src={design.image} alt={`Desain rumah ${design.name}`} fill sizes="(max-width: 900px) 100vw, 900px" className="object-cover" />
            <span className="absolute left-4 top-4 rounded-full bg-[#fcd47c] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#2b3361]">
              Desain Dipilih
            </span>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 md:p-8">
            {[
              ["Tipe Rumah", design.name],
              ["Gaya Arsitektur", design.style],
              ["Lokasi", design.location],
              ["Area (Tanah/Bangunan)", `${design.landArea} m² / ${design.buildingArea} m²`],
              ["Estimasi Biaya", money(design.estimatedCost)],
              ["Estimasi Waktu", `${design.estimatedDuration} Bulan`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">{label}</p>
                <p className="mt-1 text-lg font-bold text-[#111e3f]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-[#dbe4f2] bg-white p-6 shadow-sm md:p-8">
          <label htmlFor="alamatProyek" className="mb-3 block text-sm font-bold uppercase tracking-wider text-[#475569]">
            Alamat Lengkap Proyek
          </label>
          <textarea
            id="alamatProyek"
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              if (submitAttempted) setErrors((prev) => ({ ...prev, alamat: event.target.value.trim() ? "" : "Alamat lengkap proyek wajib diisi." }));
            }}
            placeholder="Masukkan alamat lengkap di wilayah Jawa Barat"
            rows={3}
            aria-invalid={Boolean(errors.alamat)}
            className={`w-full resize-y rounded-2xl border p-4 text-sm outline-none transition focus:ring-2 focus:ring-[#045ec2]/25 ${errors.alamat ? "border-[#dc2626]" : "border-[#dbe4f2] focus:border-[#8fb9ed]"
              }`}
          />
          {errors.alamat && <p className="mt-2 text-sm font-semibold text-[#dc2626]">{errors.alamat}</p>}
        </section>

        <section className="mt-10 rounded-3xl border border-[#dbe4f2] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-4">
            <h2 className="shrink-0 text-sm font-bold uppercase tracking-wider text-[#475569]">Dokumen Pendukung</h2>
            <div className="h-px flex-1 bg-[#edf1f6]" />
          </div>
          <p className="mt-3 text-sm text-[#64748b]">1 file maksimal 2MB · JPG, PNG, atau PDF</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {documentFields.map((field) => (
              <div key={field.id}>
                <UploadField
                  field={field}
                  state={documents[field.id]}
                  onChange={(file) => {
                    setDocuments((prev) => ({ ...prev, [field.id]: file }));
                    if (submitAttempted && field.required && !file) {
                      setErrors((prev) => ({ ...prev, [field.title]: `${field.title} wajib diisi.` }));
                    } else {
                      setErrors((prev) => ({ ...prev, [field.title]: "" }));
                    }
                  }}
                  onError={(id, message) => setErrors((prev) => ({ ...prev, [id]: message }))}
                />
                {errors[field.id] && <p className="mt-2 text-sm font-semibold text-[#dc2626]">{errors[field.id]}</p>}
                {errors[field.title] && submitAttempted && !documents[field.id] && (
                  <p className="mt-2 text-sm font-semibold text-[#dc2626]">{errors[field.title]}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-[#fcd47c]/60 bg-[#fffaf0] p-5 text-sm text-[#475569]">
          <strong>Penting:</strong> Platform Way2Home hanya melayani jasa konstruksi dan material. Segala bentuk pengurusan perizinan (IMB/PBG) tidak termasuk dalam cakupan layanan platform.
        </section>

        <div className="mt-10 text-center">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="min-h-14 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 text-base font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "Sedang Mengirim..." : submitted ? "Ajukan Ulang" : "Ajukan Pembangunan"}
          </button>
          <p className="mt-4 text-sm text-[#64748b]">
            Tim spesialis kami akan menghubungi Anda dalam 1x24 jam setelah verifikasi dokumen.
          </p>
        </div>
      </div>
    </main>
  );
}
