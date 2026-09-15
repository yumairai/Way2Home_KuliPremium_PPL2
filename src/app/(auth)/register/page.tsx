"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
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

    // TODO:
    // Nanti di sini kita sambungkan ke API register Way2Home.

    console.log({
      name,
      email,
      phone_number: phoneNumber,
      password,
      password_confirmation: passwordConfirmation,
    });

    // Temporary loading simulation
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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

            {/* =========================
                TERMS & CONDITIONS
                ========================= */}
            <div className="mb-5">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-[#2B3361]">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[#2B3361]"
                />

                <span>Saya setuju dengan Syarat & Ketentuan</span>
              </label>

              {errors.terms && (
                <p className="mt-1 text-xs text-red-500">{errors.terms}</p>
              )}
            </div>

            {/* =========================
                REGISTER BUTTON
                ========================= */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                flex w-full items-center
                justify-center gap-2
                rounded-[10px]
                bg-[#2B3361]
                px-4 py-3
                font-bold text-white
                transition
                hover:bg-[#21274b]
                disabled:cursor-wait
                disabled:opacity-85
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
            src="/images/logo-w2h.png"
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
    </main>
  );
}
