"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth.service";

const legalContent = {
  terms: [
    ["1. Ketentuan Umum", "Dengan menggunakan Way2Home, pengguna menyatakan bahwa informasi yang diberikan adalah benar, lengkap, dan dapat dipertanggungjawabkan."],
    ["2. Akun Pengguna", "Pengguna bertanggung jawab menjaga keamanan akun, termasuk email, kata sandi, dan informasi lain yang digunakan untuk mengakses Way2Home."],
    ["3. Data Pengguna", "Data yang diberikan pengguna digunakan untuk menyediakan layanan Way2Home, termasuk pengelolaan proyek pembangunan dan fitur yang tersedia dalam sistem."],
    ["4. Rekomendasi dan Informasi Sistem", "Informasi, rekomendasi desain, estimasi, atau analisis yang diberikan oleh sistem merupakan informasi pendukung dan tidak menggantikan keputusan profesional dalam pelaksanaan pembangunan."],
    ["5. Penggunaan Sistem", "Pengguna tidak diperkenankan menggunakan Way2Home untuk tujuan yang melanggar hukum, memberikan informasi palsu, atau melakukan tindakan yang dapat mengganggu keamanan dan operasional sistem."],
    ["6. Perubahan Layanan", "Way2Home dapat melakukan perubahan, pengembangan, atau pembaruan terhadap fitur dan layanan untuk meningkatkan kualitas sistem."],
    ["7. Persetujuan", "Dengan mencentang checkbox pada saat registrasi, pengguna menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan serta Kebijakan Privasi Way2Home."],
  ],
  privacy: [
    ["1. Data yang Dikumpulkan", "Way2Home dapat mengumpulkan data akun, informasi profil, data preferensi desain, serta data yang berkaitan dengan proyek pembangunan."],
    ["2. Penggunaan Data", "Data digunakan untuk menyediakan layanan, mengelola proyek, memberikan rekomendasi, dan meningkatkan kualitas sistem Way2Home."],
    ["3. Keamanan Data", "Way2Home berupaya menjaga keamanan data pengguna dan membatasi akses terhadap data sesuai kebutuhan sistem."],
    ["4. Penggunaan Fitur AI", "Data tertentu dapat digunakan sebagai input untuk fitur analisis atau rekomendasi berbasis AI yang tersedia dalam Way2Home."],
    ["5. Persetujuan Pengguna", "Dengan menggunakan Way2Home, pengguna menyetujui pengumpulan dan penggunaan data sesuai dengan Kebijakan Privasi ini."],
  ],
} as const;

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [terms, setTerms] = useState(false);
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);

  const [submitError, setSubmitError] = useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    passwordConfirmation: "",
    terms: "",
  });

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      passwordConfirmation: "",
      terms: "",
    };

    // Nama
    if (name.trim().length < 2) {
      newErrors.name = "Nama lengkap wajib diisi.";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      newErrors.email = "Format alamat email tidak valid.";
    }

    // Password
    if (password.length < 8) {
      newErrors.password = "Kata sandi minimal harus terdiri dari 8 karakter.";
    }

    // Password confirmation
    if (passwordConfirmation !== password) {
      newErrors.passwordConfirmation = "Konfirmasi kata sandi tidak sesuai.";
    }

    // Phone number
    const phoneRegex = /^[0-9]{10,14}$/;

    if (!phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = "Format nomor HP tidak valid.";
    }

    // Terms
    if (!terms) {
      newErrors.terms = "Anda harus menyetujui Syarat & Ketentuan.";
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setIsLoading(true);
    setSubmitError("");

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phoneNumber,
      password,
    });

    if (!result.ok) {
      setSubmitError(result.message);
      setIsLoading(false);
      return;
    }

    router.push("/login?registered=1");
  };

  return (
    <main className="flex min-h-screen flex-col-reverse lg:flex-row">
      {/* =========================
          LEFT SIDE - REGISTER FORM
          ========================= */}
      <section
        className="
          relative flex w-full items-center justify-center
          overflow-hidden px-4 py-6
          lg:w-[65%] lg:px-8
        "
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/aset/construction2.jpg"
            alt="Construction background"
            fill
            priority
            className="object-cover"
          />

          {/* Background Overlay */}
          <div className="absolute inset-0 bg-[#045ec2]/25" />
        </div>

        {/* Register Form */}
        <div
          className="
            relative z-10 w-full max-w-md
            rounded-[18px]
            border border-gray-400/90
            bg-[#ebfaff]
            px-6 py-7
            shadow-[0_8px_32px_rgba(0,0,0,0.1)]
            sm:px-10
          "
        >
          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[#2B3361]">
              Buat Akun Baru
            </h1>

            <p className="mt-1 text-sm text-[#647ca9]">
              Silakan isi data di bawah ini untuk mendaftar
            </p>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="mb-4 text-center text-sm text-red-500">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* =========================
                NAMA LENGKAP
                ========================= */}
            <div className="mb-3.5">
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm text-[#2B3361]"
              >
                Nama Lengkap
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                className="
                  w-full rounded-lg
                  border border-gray-200
                  bg-white px-3 py-2.5
                  text-sm text-gray-800
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-[#045ec2]
                "
              />

              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* =========================
                EMAIL
                ========================= */}
            <div className="mb-3.5">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm text-[#2B3361]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email aktif"
                required
                className="
                  w-full rounded-lg
                  border border-gray-200
                  bg-white px-3 py-2.5
                  text-sm text-gray-800
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-[#045ec2]
                "
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* =========================
                NOMOR HP
                ========================= */}
            <div className="mb-3.5">
              <label
                htmlFor="phone_number"
                className="mb-1.5 block text-sm text-[#2B3361]"
              >
                Nomor HP
              </label>

              <input
                id="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567xxx"
                required
                pattern="[0-9]{10,14}"
                inputMode="numeric"
                className="
                  w-full rounded-lg
                  border border-gray-200
                  bg-white px-3 py-2.5
                  text-sm text-gray-800
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-[#045ec2]
                "
              />

              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* =========================
                PASSWORD
                ========================= */}
            <div className="mb-3.5">
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm text-[#2B3361]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Buat password"
                  required
                  className="
                    w-full rounded-lg
                    border border-gray-200
                    bg-white
                    px-3 py-2.5 pr-11
                    text-sm text-gray-800
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-[#045ec2]
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="
                    absolute right-2.5 top-1/2
                    -translate-y-1/2
                    cursor-pointer p-1
                  "
                >
                  <Image
                    src={
                      showPassword
                        ? "/images/icon/buka.png"
                        : "/images/icon/tutup.png"
                    }
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* =========================
                KONFIRMASI PASSWORD
                ========================= */}
            <div className="mb-3.5">
              <label
                htmlFor="password_confirmation"
                className="mb-1.5 block text-sm text-[#2B3361]"
              >
                Konfirmasi Password
              </label>

              <div className="relative">
                <input
                  id="password_confirmation"
                  type={showPasswordConfirmation ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Ulangi password"
                  required
                  className="
                    w-full rounded-lg
                    border border-gray-200
                    bg-white
                    px-3 py-2.5 pr-11
                    text-sm text-gray-800
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-[#045ec2]
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                  aria-label={
                    showPasswordConfirmation
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="
                    absolute right-2.5 top-1/2
                    -translate-y-1/2
                    cursor-pointer p-1
                  "
                >
                  <Image
                    src={
                      showPasswordConfirmation
                        ? "/images/icon/buka.png"
                        : "/images/icon/tutup.png"
                    }
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
              </div>

              {errors.passwordConfirmation && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.passwordConfirmation}
                </p>
              )}
            </div>

            <div className="mb-5">
              <div className="flex items-start gap-2 text-sm text-[#2B3361]">
                <input
                  id="legal-consent"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#004796]"
                />
                <label htmlFor="legal-consent" className="cursor-pointer leading-5">
                  Dengan mendaftar, saya menyetujui{" "}
                  <button type="button" onClick={() => setActiveModal("terms")} className=" font-semibold text-[#004796] cursor-pointer">
                    Syarat &amp; Ketentuan
                  </button>{" "}
                  dan{" "}
                  <button type="button" onClick={() => setActiveModal("privacy")} className="font-semibold text-[#004796] cursor-pointer">
                    Kebijakan Privasi
                  </button>{" "}
                  Way2Home.
                </label>
              </div>

              {errors.terms && (
                <p className="mt-1 text-xs text-red-500">{errors.terms}</p>
              )}
            </div>

            {/* =========================
                REGISTER BUTTON
                ========================= */}
            <button
              type="submit"
              disabled={isLoading || !terms}
              className="
                flex w-full items-center
                justify-center gap-2
                rounded-[10px]
                bg-[#2B3361]
                px-4 py-3
                font-bold text-white
                transition
                hover:bg-[#21274b]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isLoading && (
                <span
                  className="
                    h-4 w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-white/35
                    border-t-white
                  "
                />
              )}

              <span>{isLoading ? "Memproses..." : "Daftar Sekarang"}</span>
            </button>

            {/* =========================
                LOGIN LINK
                ========================= */}
            <p className="mt-4 text-center text-sm text-[#2B3361]">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-[#045ec2] hover:underline">
                Login di sini
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* =========================
          RIGHT SIDE - BRANDING
          ========================= */}
      <section
        className="
          flex w-full items-center justify-center
          bg-[#2B3361]
          px-4 py-8
          text-center text-white
          lg:w-[35%]
        "
      >
        <div>
          <Image
            src="/images/aset/logo-w2h.png"
            alt="Logo Way2Home"
            width={120}
            height={120}
            className="mx-auto mb-3 brightness-0 invert"
          />

          <h2 className="text-3xl font-bold">Way2Home</h2>

          <p className="mt-2 text-base text-[#fcd47c]">
            Membuat rumahmu lebih berwarna
          </p>
        </div>
      </section>

      {activeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setActiveModal(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
              <h2 id="legal-modal-title" className="text-lg font-bold text-[#2B3361] sm:text-xl">
                {activeModal === "terms" ? "Syarat & Ketentuan" : "Kebijakan Privasi"}
              </h2>
              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={() => setActiveModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                ×
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-5 sm:px-7">
              <div className="space-y-5 text-sm leading-6 text-gray-600">
                {legalContent[activeModal].map(([title, description]) => (
                  <section key={title}>
                    <h3 className="mb-1 font-semibold text-[#2B3361]">{title}</h3>
                    <p>{description}</p>
                  </section>
                ))}
              </div>
            </div>
            <footer className="border-t border-gray-100 px-5 py-4 text-right sm:px-7">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-[#004796] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#045ec2]"
              >
                Tutup
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
