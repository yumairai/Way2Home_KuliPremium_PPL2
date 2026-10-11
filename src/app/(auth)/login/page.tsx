"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/services/auth.service";
import { authenticateDemoAccount, setDemoRole, type DemoRole } from "@/utils/demo-auth";

const DEMO_HOME: Record<DemoRole, string> = {
  admin: "/admin",
  mandor: "/mandor",
  pengawas: "/pengawas",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const [errorMessage, setErrorMessage] = useState("");

  const validateForm = () => {
    const nextErrors = { email: "", password: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Format email tidak valid.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password wajib diisi.";
    }

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");

    if (!validateForm()) return;

    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const demoRole = authenticateDemoAccount(normalizedEmail, password);

    if (demoRole) {
      setDemoRole(demoRole);
      router.replace(DEMO_HOME[demoRole]);
      return;
    }

    const result = await login(normalizedEmail, password);

    if (!result.ok) {
      setErrorMessage(result.message);
      setIsLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col-reverse lg:flex-row">
      {/* =========================
          LEFT SIDE - LOGIN FORM
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
            src="/images/aset/construction.jpg"
            alt="Construction background"
            fill
            priority
            className="object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-[#045ec2]/25" />
        </div>

        {/* Login Form */}
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
              Selamat Datang
            </h1>

            <p className="mt-1 text-sm text-[#647ca9]">
              Masuk ke akun Way2Home
            </p>
          </div>

          {/* Success Message */}
          {registered && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-100 px-3 py-2 text-center text-sm text-green-800">
              Registrasi berhasil! Cek email kamu dan klik tautan verifikasi sebelum masuk. Jika belum terlihat, periksa folder spam.
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 text-center text-sm text-red-500">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* =========================
                EMAIL
                ========================= */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm text-[#2B3361]"
              >
                Email
              </label>

              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="Masukkan email"
                aria-invalid={!!errors.email}
                className={
                  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 " +
                  (errors.email
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-gray-200 focus:border-[#045ec2]")
                }
              />

              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* =========================
                PASSWORD
                ========================= */}
            <div className="mb-4">
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  placeholder="Masukkan password"
                  aria-invalid={!!errors.password}
                  className={
                    "w-full rounded-lg border bg-white px-3 py-2.5 pr-11 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 " +
                    (errors.password
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 focus:border-[#045ec2]")
                  }
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
                    cursor-pointer
                    p-1
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
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            {/* =========================
                OPTIONS
                ========================= */}
            <div className="mb-5 flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-[#2B3361]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#2B3361]"
                />

                <span>Remember me</span>
              </label>
            </div>

            {/* =========================
                LOGIN BUTTON
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

              <span>{isLoading ? "Memproses..." : "Masuk"}</span>
            </button>

            {/* =========================
                REGISTER
                ========================= */}
            <p className="mt-4 text-center text-sm text-[#2B3361]">
              Belum punya akun?{" "}
              <Link href="/register" className="text-[#045ec2] hover:underline">
                Daftar
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
            Memenuhi kebutuhan rumahmu
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
