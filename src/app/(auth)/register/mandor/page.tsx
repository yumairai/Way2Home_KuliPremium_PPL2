"use client";

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type FormErrors = Partial<
  Record<
    | "name"
    | "email"
    | "phone"
    | "password"
    | "confirmation"
    | "expertise"
    | "experience"
    | "area"
    | "experienceSummary"
    | "previousProjects"
    | "cv"
    | "terms",
    string
  >
>;
const maxFileSize = 5 * 1024 * 1024;

export default function MandorRegisterPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmation: "",
    expertise: "",
    experience: "",
    area: "",
    experienceSummary: "",
    previousProjects: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);

  const setField = (field: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  const selectFile = (file?: File) => {
    if (!file) return;
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setErrors((current) => ({
        ...current,
        cv: "Pilih file dengan format PDF.",
      }));
      setCv(null);
      return;
    }
    if (file.size > maxFileSize) {
      setErrors((current) => ({
        ...current,
        cv: "Ukuran file maksimal 5 MB.",
      }));
      setCv(null);
      return;
    }
    setCv(file);
    setErrors((current) => ({ ...current, cv: undefined }));
  };
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) =>
    selectFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FormErrors = {};
    if (values.name.trim().length < 2) next.name = "Masukkan nama lengkap.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Masukkan alamat email yang valid.";
    if (!/^[0-9]{10,14}$/.test(values.phone.replace(/\D/g, "")))
      next.phone = "Nomor HP harus terdiri dari 10–14 angka.";
    if (values.password.length < 8)
      next.password = "Kata sandi minimal 8 karakter.";
    if (values.confirmation !== values.password)
      next.confirmation = "Konfirmasi kata sandi tidak sesuai.";
    if (!values.expertise) next.expertise = "Pilih keahlian utama.";
    if (
      !values.experience ||
      Number(values.experience) < 0 ||
      Number(values.experience) > 60
    )
      next.experience = "Masukkan pengalaman 0–60 tahun.";
    if (values.area.trim().length < 2) next.area = "Masukkan area kerja.";
    if (values.experienceSummary.trim().length < 20)
      next.experienceSummary = "Ceritakan pengalaman minimal 20 karakter.";
    if (values.previousProjects.trim().length < 5)
      next.previousProjects =
        "Masukkan setidaknya satu proyek yang pernah dilakukan.";
    if (!cv) next.cv = "Unggah CV dalam format PDF (maksimal 5 MB).";
    if (!terms) next.terms = "Persetujuan diperlukan untuk melanjutkan.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitted(true);
  };

  const inputClass = (error?: string) =>
    `w-full rounded-lg border ${error ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"} px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#045ec2] focus:ring-2 focus:ring-[#045ec2]/15`;
  const field = (
    key: keyof typeof values,
    label: string,
    type = "text",
    placeholder = "",
    options?: string[],
  ) => (
    <div key={key}>
      <label
        htmlFor={`mandor-${key}`}
        className="mb-1.5 block text-sm font-medium text-[#2B3361]"
      >
        {label}
      </label>
      {options ? (
        <select
          id={`mandor-${key}`}
          value={values[key]}
          onChange={(event) => setField(key, event.target.value)}
          className={inputClass(errors[key] as string)}
        >
          <option value="">Pilih keahlian</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={`mandor-${key}`}
          type={type}
          value={values[key]}
          onChange={(event) => setField(key, event.target.value)}
          placeholder={placeholder}
          min={type === "number" ? 0 : undefined}
          max={type === "number" ? 60 : undefined}
          className={inputClass(errors[key] as string)}
        />
      )}
      {errors[key] && (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col-reverse lg:flex-row">
      <section className="relative flex w-full items-center justify-center overflow-hidden px-4 py-8 lg:w-[65%] lg:px-8">
        <div className="absolute inset-0">
          <Image
            src="/images/aset/construction2.jpg"
            alt="Proyek pembangunan rumah"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#045ec2]/30" />
        </div>
        <div className="relative z-10 my-4 w-full max-w-2xl rounded-[18px] border border-slate-300 bg-[#ebfaff] px-5 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:px-9">
          <Link
            href="/register"
            className="text-sm font-medium text-[#045ec2] hover:underline"
          >
            Kembali ke pilihan akun
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#2B3361] sm:text-3xl">
            Daftar sebagai mitra mandor
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Lengkapi profil dan pengalaman kerja Anda untuk bergabung dengan
            Way2Home.
          </p>
          {submitted ? (
            <div
              role="status"
              className="mt-6 rounded-lg border border-green-300 bg-green-50 px-4 py-4 text-sm font-medium leading-6 text-green-900"
            >
              Pembuatan akun mandor berhasil, tolong ya qiya nanti hubungin ke
              db biar bisa login beneran si mandornya.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
              <section aria-labelledby="account-fields-title">
                <h2
                  id="account-fields-title"
                  className="mb-3 border-b border-[#cadce8] pb-2 text-base font-semibold text-[#2B3361]"
                >
                  Informasi akun
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field(
                    "name",
                    "Nama lengkap",
                    "text",
                    "Nama sesuai identitas",
                  )}
                  {field("email", "Email", "email", "nama@email.com")}
                  {field("phone", "Nomor HP", "tel", "Contoh: 081234567890")}
                  {field(
                    "password",
                    "Kata sandi",
                    "password",
                    "Minimal 8 karakter",
                  )}
                  {field(
                    "confirmation",
                    "Konfirmasi kata sandi",
                    "password",
                    "Ulangi kata sandi",
                  )}
                </div>
              </section>
              <section aria-labelledby="professional-fields-title">
                <h2
                  id="professional-fields-title"
                  className="mb-3 border-b border-[#cadce8] pb-2 text-base font-semibold text-[#2B3361]"
                >
                  Pengalaman kerja
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("expertise", "Keahlian utama", "text", "", [
                    "Pembangunan rumah",
                    "Struktur dan pondasi",
                    "Finishing",
                    "Instalasi listrik",
                    "Plumbing",
                    "Lainnya",
                  ])}
                  {field(
                    "experience",
                    "Pengalaman (tahun)",
                    "number",
                    "Contoh: 5",
                  )}
                  {field("area", "Area kerja", "text", "Kota atau kabupaten")}
                </div>
                <div className="mt-4 grid gap-4">
                  <div>
                    <label
                      htmlFor="mandor-experience-summary"
                      className="mb-1.5 block text-sm font-medium text-[#2B3361]"
                    >
                      Ceritakan pengalaman kerja Anda secara singkat
                    </label>
                    <textarea
                      id="mandor-experience-summary"
                      value={values.experienceSummary}
                      onChange={(event) =>
                        setField("experienceSummary", event.target.value)
                      }
                      placeholder="Jelaskan tanggung jawab dan pengalaman kerja Anda di bidang konstruksi"
                      rows={4}
                      maxLength={1000}
                      className={inputClass(errors.experienceSummary)}
                      aria-describedby="mandor-experience-summary-help"
                    />
                    <p
                      id="mandor-experience-summary-help"
                      className="mt-1 text-xs text-slate-500"
                    >
                      Minimal 20 karakter.
                    </p>
                    {errors.experienceSummary && (
                      <p className="mt-1 text-xs text-red-700" role="alert">
                        {errors.experienceSummary}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="mandor-previous-projects"
                      className="mb-1.5 block text-sm font-medium text-[#2B3361]"
                    >
                      Project yang pernah Anda lakukan
                    </label>
                    <textarea
                      id="mandor-previous-projects"
                      value={values.previousProjects}
                      onChange={(event) =>
                        setField("previousProjects", event.target.value)
                      }
                      placeholder="Contoh: pembangunan rumah dua lantai, pekerjaan finishing, atau proyek lainnya"
                      rows={3}
                      maxLength={1000}
                      className={inputClass(errors.previousProjects)}
                      aria-describedby="mandor-previous-projects-help"
                    />
                    <p
                      id="mandor-previous-projects-help"
                      className="mt-1 text-xs text-slate-500"
                    >
                      Cantumkan satu atau beberapa proyek yang relevan.
                    </p>
                    {errors.previousProjects && (
                      <p className="mt-1 text-xs text-red-700" role="alert">
                        {errors.previousProjects}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="mb-1.5 block text-sm font-medium text-[#2B3361]">
                    CV / riwayat pengalaman
                  </span>
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`rounded-lg border border-dashed ${dragging ? "border-[#045ec2] bg-blue-50" : errors.cv ? "border-red-400 bg-red-50" : "border-slate-300 bg-white/70"} px-4 py-5 text-center`}
                  >
                    <input
                      ref={fileInput}
                      id="mandor-cv"
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={onFileChange}
                      className="sr-only"
                      aria-describedby="cv-help"
                    />
                    <p className="text-sm text-slate-700">
                      Seret file PDF ke sini atau{" "}
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="font-semibold text-[#045ec2] underline underline-offset-2"
                      >
                        pilih file
                      </button>
                    </p>
                    <p id="cv-help" className="mt-1 text-xs text-slate-500">
                      Format PDF, ukuran maksimal 5 MB.
                    </p>
                    {cv && (
                      <div className="mt-3 flex items-center justify-center gap-3 text-sm text-[#2B3361]">
                        <span className="max-w-[75%] truncate">
                          {cv.name} · {(cv.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCv(null);
                            if (fileInput.current) fileInput.current.value = "";
                          }}
                          className="font-medium text-red-700 underline"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.cv && (
                    <p className="mt-1 text-xs text-red-700" role="alert">
                      {errors.cv}
                    </p>
                  )}
                </div>
              </section>
              <div>
                <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(event) => setTerms(event.target.checked)}
                    className="mt-1 accent-[#045ec2]"
                  />
                  <span>
                    Saya menyatakan informasi yang diberikan benar dan
                    menyetujui pemrosesan data untuk keperluan pendaftaran
                    mitra.
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-xs text-red-700" role="alert">
                    {errors.terms}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="min-h-11 w-full rounded-lg bg-[#2B3361] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#21274b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2]"
              >
                Buat akun mitra
              </button>
            </form>
          )}
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-[#2B3361] px-5 py-8 text-center text-white lg:w-[35%]">
        <div>
          <Image
            src="/images/aset/logo-w2h.png"
            alt="Logo Way2Home"
            width={120}
            height={120}
            className="mx-auto mb-3 brightness-0 invert"
          />
          <p className="text-3xl font-bold">Way2Home</p>
          <p className="mt-2 text-base text-[#fcd47c]">
            Membuat rumahmu lebih berwarna
          </p>
        </div>
      </section>
    </main>
  );
}
