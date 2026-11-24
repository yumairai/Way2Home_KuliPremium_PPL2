"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HouseDesign } from "@/types/house-design";
import { useTestMode } from "@/hooks/useTestMode";
import { loadAllTestDocuments } from "@/utils/test-assets";

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
  file: File;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function UploadField({
  field,
  state,
  onChange,
  onError,
  isTestMode = false,
}: {
  field: BuildDocumentField;
  state: DocumentFile | null;
  onChange: (file: DocumentFile | null) => void;
  onError: (id: string, message: string) => void;
  isTestMode?: boolean;
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
        onChange({
          name: file.name,
          size: file.size,
          type: file.type,
          preview: String(reader.result),
          file,
        });
      reader.readAsDataURL(file);
    } else {
      onChange({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: null,
        file,
      });
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
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.preview}
            alt={`Pratinjau ${field.title}`}
            className="max-h-24 max-w-24 rounded-xl object-cover"
          />
          {isTestMode && (
            <span className="absolute -top-2 -right-2 rounded-full bg-[#fbbf24] px-2 py-0.5 text-xs font-bold text-[#78350f] shadow-sm">
              TEST
            </span>
          )}
        </div>
      ) : state ? (
        <div className="relative">
          <div className="text-4xl">📄</div>
          {isTestMode && (
            <span className="absolute -top-2 -right-2 rounded-full bg-[#fbbf24] px-2 py-0.5 text-xs font-bold text-[#78350f] shadow-sm">
              DUMMY
            </span>
          )}
        </div>
      ) : (
        <div className="text-4xl opacity-70">📁</div>
      )}

      <p className="font-bold text-[#111e3f]">{field.title}</p>
      <p
        className={`text-xs ${state ? "font-semibold text-[#059669]" : "text-[#64748b]"}`}
      >
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

export default function BuildHouseForm({ design }: { design: HouseDesign }) {
  const { isTestMode, loading: testModeLoading } = useTestMode();
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [documents, setDocuments] = useState<
    Record<string, DocumentFile | null>
  >({
    sertifikat_tanah: null,
    ktp_pemilik: null,
    imb_pbg: null,
    surat_kuasa: null,
  });
  const [loadingTestAssets, setLoadingTestAssets] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingProjectId, setExistingProjectId] = useState<string | null>(
    null,
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-prefill test documents for test users
  useEffect(() => {
    if (testModeLoading || !isTestMode) return;
    if (documents.sertifikat_tanah) return; // Already loaded

    async function prefillTestDocuments() {
      setLoadingTestAssets(true);
      try {
        const testDocs = await loadAllTestDocuments();

        const newDocuments: Record<string, DocumentFile | null> = {};

        for (const [key, file] of Object.entries(testDocs)) {
          if (file) {
            // Convert File to DocumentFile with preview
            let preview: string | null = null;
            if (file.type.startsWith('image/')) {
              preview = URL.createObjectURL(file);
            }

            newDocuments[key] = {
              name: file.name,
              size: file.size,
              type: file.type,
              preview,
              file,
            };
          } else {
            newDocuments[key] = null;
          }
        }

        setDocuments(newDocuments);
      } catch (error) {
        console.error('Failed to load test documents:', error);
      } finally {
        setLoadingTestAssets(false);
      }
    }

    prefillTestDocuments();
  }, [isTestMode, testModeLoading, documents.sertifikat_tanah]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 8000);
    return () => clearTimeout(timer);
  }, [notification]);

  const documentFields: BuildDocumentField[] = [
    {
      id: "sertifikat_tanah",
      title: "Sertifikat Tanah (SHM/HGB)",
      subtitle: "Pilih file atau drag & drop",
      required: true,
    },
    {
      id: "ktp_pemilik",
      title: "KTP Pemilik",
      subtitle: "Pilih file atau drag & drop",
      required: true,
    },
    {
      id: "imb_pbg",
      title: "IMB/PBG",
      subtitle: "Pilih file atau drag & drop",
      required: true,
    },
    {
      id: "surat_kuasa",
      title: "Surat Kuasa (Jika Ada)",
      subtitle: "Pilih file atau drag & drop",
      required: false,
    },
  ];

  const requiredMissing = documentFields
    .filter((field) => field.required && !documents[field.id])
    .map((field) => field.title);
  const addressMissing = !address.trim();

  const money = (value: number) =>
    `Rp ${(value / 1000000).toLocaleString("id-ID")} juta`;

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setExistingProjectId(null);

    let hasClientError = false;
    const newErrors: Record<string, string> = {};

    if (addressMissing) {
      newErrors.alamat = "Alamat lengkap proyek wajib diisi.";
      hasClientError = true;
    }

    const numBudget = Number(budget);
    if (!budget || isNaN(numBudget)) {
      newErrors.budget = "Budget proyek wajib diisi.";
      hasClientError = true;
    } else if (numBudget < design.estimatedCost) {
      newErrors.budget = `Budget proyek tidak boleh kurang dari estimasi biaya desain (${money(design.estimatedCost)}).`;
      hasClientError = true;
    }

    requiredMissing.forEach((title) => {
      newErrors[title] = `${title} wajib diisi.`;
      hasClientError = true;
    });

    setErrors(newErrors);

    if (hasClientError) {
      setNotification({
        type: "error",
        text: "Lengkapi data yang wajib diisi terlebih dahulu.",
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append("designSlug", design.slug);
      formData.append("alamat", address.trim());
      formData.append("budget", budget);

      if (documents.sertifikat_tanah?.file) {
        formData.append("sertifikat_tanah", documents.sertifikat_tanah.file);
      }
      if (documents.ktp_pemilik?.file) {
        formData.append("ktp_pemilik", documents.ktp_pemilik.file);
      }
      if (documents.imb_pbg?.file) {
        formData.append("imb_pbg", documents.imb_pbg.file);
      }
      if (documents.surat_kuasa?.file) {
        formData.append("surat_kuasa", documents.surat_kuasa.file);
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();

      if (response.status === 201) {
        setSubmitted(true);
        setNotification({
          type: "success",
          text: "Pengajuan pembangunan berhasil terkirim! Status proyek Anda saat ini: Menunggu Pengawas.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (response.status === 409) {
        setNotification({
          type: "error",
          text:
            resData.message ||
            "Anda sudah memiliki proyek aktif untuk desain ini.",
        });
        if (resData.projectId) {
          setExistingProjectId(resData.projectId);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (response.status === 422) {
        if (resData.errors) {
          setErrors(resData.errors);
        }
        setNotification({
          type: "error",
          text: resData.message || "Mohon periksa kembali data pengajuan Anda.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setNotification({
          type: "error",
          text:
            resData.message || "Terjadi kesalahan saat mengajukan pembangunan.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan jaringan saat terhubung ke server.";
      setNotification({
        type: "error",
        text: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 pt-32 text-[#111e3f]">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold tracking-wide text-[#045ec2]">
            Form Pembangunan Rumah
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-[-0.03em] md:text-5xl">
            Lengkapi detail proyek Anda
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#64748b]">
            Mulai proses pembangunan profesional bersama Way2Home dengan data
            proyek yang akurat.
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
            <p>{notification.text}</p>
            {existingProjectId && (
              <div className="mt-3">
                <Link
                  href="/proyek"
                  className="inline-block rounded-full bg-[#004796] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#045ec2]"
                >
                  Lihat Proyek Saya →
                </Link>
              </div>
            )}
          </div>
        )}

        {submitted && (
          <div className="mt-8 rounded-3xl border border-[#059669] bg-[#ecfdf5] p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-[#065f46]">
              Pengajuan Terkirim!
            </h2>
            <p className="mt-3 text-[#047857]">
              Terima kasih. Proyek Anda telah masuk ke antrean admin dengan
              status <strong>Verifikasi Dokumen</strong>. Tim kami akan
              memverifikasi dokumen Anda dalam 1x24 jam.
            </p>
            <div className="mt-6">
              <Link
                href="/proyek"
                className="inline-block rounded-full bg-[#004796] px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-[#045ec2]"
              >
                Lihat Daftar Proyek Saya
              </Link>
            </div>
          </div>
        )}

        <section className="mt-10 overflow-hidden rounded-3xl border border-[#dbe4f2] bg-white shadow-[0_12px_30px_rgba(17,30,63,0.06)]">
          <div className="relative aspect-[16/9]">
            <Image
              src={design.image}
              alt={`Desain rumah ${design.name}`}
              fill
              sizes="(max-width: 900px) 100vw, 900px"
              className="object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full bg-[#fcd47c] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#2b3361]">
              Desain Dipilih
            </span>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 md:p-8">
            {[
              ["Tipe Rumah", design.name],
              ["Gaya Arsitektur", design.style],
              ["Lokasi", design.location],
              [
                "Area (Tanah/Bangunan)",
                `${design.landArea} m² / ${design.buildingArea} m²`,
              ],
              ["Estimasi Biaya", money(design.estimatedCost)],
              ["Estimasi Waktu", `${design.estimatedDuration} Bulan`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  {label}
                </p>
                <p className="mt-1 text-lg font-bold text-[#111e3f]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <fieldset disabled={submitted} className="border-0 p-0 m-0">
          <section className="mt-10 rounded-3xl border border-[#dbe4f2] bg-white p-6 shadow-sm md:p-8">
            <label
              htmlFor="alamatProyek"
              className="mb-3 block text-sm font-bold uppercase tracking-wider text-[#475569]"
            >
              Alamat Lengkap Proyek
            </label>
            <textarea
              id="alamatProyek"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                if (submitAttempted)
                  setErrors((prev) => ({
                    ...prev,
                    alamat: event.target.value.trim()
                      ? ""
                      : "Alamat lengkap proyek wajib diisi.",
                  }));
              }}
              placeholder="Masukkan alamat lengkap proyek di wilayah Jawa Barat"
              rows={3}
              aria-invalid={Boolean(errors.alamat)}
              className={`w-full resize-y rounded-2xl border p-4 text-sm outline-none transition focus:ring-2 focus:ring-[#045ec2]/25 ${errors.alamat ? "border-[#dc2626]" : "border-[#dbe4f2] focus:border-[#8fb9ed]"}`}
            />
            {errors.alamat && (
              <p className="mt-2 text-sm font-semibold text-[#dc2626]">
                {errors.alamat}
              </p>
            )}
          </section>

          <section className="mt-10 rounded-3xl border border-[#dbe4f2] bg-white p-6 shadow-sm md:p-8">
            <label
              htmlFor="budgetProyek"
              className="mb-3 block text-sm font-bold uppercase tracking-wider text-[#475569]"
            >
              Rencana Budget Proyek
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-4 text-sm font-bold text-[#475569]">
                Rp
              </span>
              <input
                id="budgetProyek"
                type="text"
                inputMode="numeric"
                value={budget ? Number(budget).toLocaleString("id-ID") : ""}
                onChange={(event) => {
                  const raw = event.target.value.replace(/\D/g, "");
                  setBudget(raw);
                  if (submitAttempted) {
                    const val = Number(raw);
                    if (!raw) {
                      setErrors((prev) => ({
                        ...prev,
                        budget: "Budget proyek wajib diisi.",
                      }));
                    } else if (isNaN(val) || val < design.estimatedCost) {
                      setErrors((prev) => ({
                        ...prev,
                        budget: `Budget proyek tidak boleh kurang dari estimasi biaya desain (${money(design.estimatedCost)}).`,
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, budget: "" }));
                    }
                  }
                }}
                placeholder={`Minimal ${Number(design.estimatedCost).toLocaleString("id-ID")} (sesuai estimasi desain)`}
                aria-invalid={Boolean(errors.budget)}
                className={`w-full rounded-2xl border p-4 pl-12 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#045ec2]/25 ${errors.budget ? "border-[#dc2626]" : "border-[#dbe4f2] focus:border-[#8fb9ed]"}`}
              />
            </div>
            <p className="mt-2 text-xs text-[#64748b]">
              Nominal akan otomatis diformat dengan pemisah ribuan. Minimal
              sesuai estimasi biaya: {money(design.estimatedCost)}.
            </p>
            {errors.budget && (
              <p className="mt-2 text-sm font-semibold text-[#dc2626]">
                {errors.budget}
              </p>
            )}
          </section>

          <section className="mt-10 rounded-3xl border border-[#dbe4f2] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-4">
              <h2 className="shrink-0 text-sm font-bold uppercase tracking-wider text-[#475569]">
                Dokumen Pendukung
              </h2>
              <div className="h-px flex-1 bg-[#edf1f6]" />
            </div>
            <p className="mt-3 text-sm text-[#64748b]">
              1 file maksimal 2MB · JPG, PNG, atau PDF
            </p>
            {isTestMode && loadingTestAssets && (
              <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 text-sm text-[#6b7280]">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 animate-spin text-[#f59e0b]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memuat dokumen dummy untuk mode testing...</span>
                </div>
              </div>
            )}
            {isTestMode && !loadingTestAssets && documents.sertifikat_tanah && (
              <div className="mt-4 rounded-xl border-2 border-[#fbbf24] bg-gradient-to-r from-[#fffbeb] to-[#fef3c7] p-4 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-[#92400e]">Mode Testing</p>
                    <p className="mt-1 text-[#78350f]">
                      Dokumen sudah terisi otomatis dengan file dummy untuk mempercepat testing.
                      Anda tetap dapat mengisi alamat dan budget sesuai kebutuhan testing.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {documentFields.map((field) => (
                <div key={field.id}>
                  <UploadField
                    field={field}
                    state={documents[field.id]}
                    isTestMode={isTestMode}
                    onChange={(file) => {
                      setDocuments((prev) => ({ ...prev, [field.id]: file }));
                      if (submitAttempted && field.required && !file) {
                        setErrors((prev) => ({
                          ...prev,
                          [field.title]: `${field.title} wajib diisi.`,
                        }));
                      } else {
                        setErrors((prev) => ({ ...prev, [field.title]: "" }));
                      }
                    }}
                    onError={(id, message) =>
                      setErrors((prev) => ({ ...prev, [id]: message }))
                    }
                  />
                  {errors[field.id] && (
                    <p className="mt-2 text-sm font-semibold text-[#dc2626]">
                      {errors[field.id]}
                    </p>
                  )}
                  {errors[field.title] &&
                    submitAttempted &&
                    !documents[field.id] && (
                      <p className="mt-2 text-sm font-semibold text-[#dc2626]">
                        {errors[field.title]}
                      </p>
                    )}
                </div>
              ))}
            </div>
          </section>
        </fieldset>

        <section className="mt-10 rounded-2xl border border-[#fcd47c]/60 bg-[#fffaf0] p-5 text-sm text-[#475569]">
          <strong>Penting:</strong> Platform Way2Home hanya melayani jasa
          konstruksi dan material. Segala bentuk pengurusan perizinan (IMB/PBG)
          tidak termasuk dalam cakupan layanan platform.
        </section>

        <div className="mt-10 text-center">
          <button
            type="button"
            disabled={submitting || submitted}
            onClick={handleSubmit}
            className="min-h-14 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 text-base font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting
              ? "Sedang Mengirim..."
              : submitted
                ? "Pengajuan Terkirim"
                : "Ajukan Pembangunan"}
          </button>
          <p className="mt-4 text-sm text-[#64748b]">
            Tim spesialis kami akan menghubungi Anda dalam 1x24 jam setelah
            verifikasi dokumen.
          </p>
        </div>
      </div>
    </main>
  );
}
