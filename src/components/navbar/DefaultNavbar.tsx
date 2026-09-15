"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function DefaultNavbar() {
  // Untuk sementara digunakan untuk testing UI.
  // false = guest
  // true = user login
  const isLoggedIn = false;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      {/*NAVBAR*/}
      <nav className="fixed top-0 z-50 w-full shadow-[0_24px_48px_rgba(14,23,68,0.06)]">
        <div className="bg-white/80 backdrop-blur-[24px]">
          {/* Ubah di baris ini: tambahkan justify-between (atau justify-evenly jika ingin ada spacing seimbang di ujung kiri-kanan) */}
          <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-4 md:px-8">
            {/* BRAND: Hapus `flex-1` di sini agar ukurannya menyesuaikan isi saja */}
            <Link
              href="/"
              className="flex min-w-0 items-center gap-1.5 md:gap-2"
            >
              <Image
                src="/images/aset/logo-w2h.png"
                alt="Logo Way2Home"
                width={40}
                height={40}
                className="h-8 md:h-12 w-auto object-contain"
              />

              <span className="whitespace-nowrap text-[0.9rem] font-black tracking-[-0.025em] text-[#111e3f] md:text-[1.2rem]">
                Way2Home
              </span>
            </Link>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/"
                className="font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]"
              >
                Beranda
              </Link>

              <Link
                href="/recommendation"
                className="font-semibold text-[#475569] transition hover:text-[#2563eb]"
              >
                Desain
              </Link>

              <Link
                href="/ai-planning-based"
                className="font-semibold text-[#475569] transition hover:text-[#2563eb]"
              >
                AI Planning Based
              </Link>
            </div>

            {/* DESKTOP ACTIONS */}
            <div className="relative hidden items-center gap-4 md:flex">
              {/* GUEST */}
              {!isLoggedIn && (
                <>
                  <Link
                    href="/login"
                    className="rounded-full bg-[#e8e2e7] px-6 py-2.5 text-base font-semibold text-[#004796] transition hover:bg-[#ede7eb] active:scale-95"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className="rounded-full bg-gradient-to-br from-[#004796] to-[#045ec2] px-6 py-2.5 text-base font-semibold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:opacity-90 active:scale-95"
                  >
                    Daftar
                  </Link>
                </>
              )}

              {/* USER */}
              {isLoggedIn && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="rounded-full"
                    aria-label="Buka profile"
                  >
                    <Image
                      src="/images/aset/avatar.jpg"
                      alt="User profile avatar"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover transition active:scale-90"
                    />
                  </button>

                  {/* PROFILE DROPDOWN */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-16 w-72 overflow-hidden rounded-b-[10px] bg-[#fffbfe] shadow-[0_24px_48px_rgba(14,23,68,0.12)]">
                      {/* Header */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-[#004796] to-[#2a3a7a] p-4 text-white">
                        <div className="absolute inset-0 opacity-15">
                          <Image
                            src="/images/aset/construction.jpg"
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="relative z-10 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                            <Image
                              src="/images/aset/avatar.jpg"
                              alt="Avatar"
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          </div>

                          <div>
                            <h3 className="text-lg font-extrabold leading-tight">
                              Robby
                            </h3>

                            <p className="mt-1 text-xs opacity-90">Customer</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu */}
                      <div className="flex flex-col gap-1 p-3">
                        <Link
                          href="/customer/order"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#475569] transition hover:bg-[#f0f4ff] hover:text-[#0053da]"
                        >
                          🛒 <span>Pesanan Saya</span>
                        </Link>

                        <Link
                          href="/proyek"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#475569] transition hover:bg-[#f0f4ff] hover:text-[#0053da]"
                        >
                          🏠 <span>Proyek Saya</span>
                        </Link>

                        <Link
                          href="/renovation"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#475569] transition hover:bg-[#f0f4ff] hover:text-[#0053da]"
                        >
                          🔨 <span>Renovasi Saya</span>
                        </Link>

                        <Link
                          href="/profile"
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#475569] transition hover:bg-[#f0f4ff] hover:text-[#0053da]"
                        >
                          👤 <span>Edit Profile</span>
                        </Link>
                      </div>

                      <div className="h-px bg-[#f1f3f9]" />

                      {/* Logout */}
                      <div className="p-3">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                          onClick={() => {
                            console.log("Logout");
                          }}
                        >
                          ↪<span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* MOBILE MENU BUTTON (Di mobile otomatis terdorong ke kanan karena justify-between) */}
            <button
              type="button"
              aria-label="Buka navigasi"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#111e3f] transition hover:bg-[#ede7eb] active:scale-95 md:hidden"
            >
              <span className="text-2xl leading-none">☰</span>
            </button>
          </div>
        </div>
      </nav>

      {/*MOBILE BACKDROP*/}
      <div
        className={`fixed inset - 0 top - 20 z - [55] bg - slate - 900 / 45 backdrop - blur - sm transition - opacity md:hidden ${
          isDrawerOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        } `}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/*        MOBILE DRAWER
       */}
      <aside
        className={`fixed left - 0 top - 20 z - [60] flex h - [calc(100vh - 5rem)] w - [min(20rem, 82vw)] flex - col bg - white p - 4 shadow - [24px_0_48px_rgba(14, 23, 68, 0.14)] transition - transform duration - 300 md:hidden ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-[102%]"
        } `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#cac4cf]/65 pb-4">
          <Link
            href="/"
            className="flex items-center gap-1.5"
            onClick={() => setIsDrawerOpen(false)}
          >
            <Image
              src="/images/aset/logo-w2h.png"
              alt="Logo Way2Home"
              width={40}
              height={40}
              className="h-8 w-8"
            />

            <span className="text-base font-black text-[#111e3f]">
              Way2Home
            </span>
          </Link>

          <button
            type="button"
            aria-label="Tutup navigasi"
            onClick={() => setIsDrawerOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e2e7] text-[#111e3f]"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex flex-col gap-4 overflow-y-auto pt-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#64748b]">
            Navigasi
          </p>

          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setIsDrawerOpen(false)}
              className="rounded-[0.9rem] border border-[#cac4cf]/45 bg-[#f7f2f6] px-4 py-3.5 font-semibold text-[#475569]"
            >
              Beranda
            </Link>

            <Link
              href="/recommendation"
              onClick={() => setIsDrawerOpen(false)}
              className="rounded-[0.9rem] border border-[#cac4cf]/45 bg-[#f7f2f6] px-4 py-3.5 font-semibold text-[#475569]"
            >
              Desain
            </Link>

            <Link
              href="/ai-planning-based"
              onClick={() => setIsDrawerOpen(false)}
              className="rounded-[0.9rem] border border-[#cac4cf]/45 bg-[#f7f2f6] px-4 py-3.5 font-semibold text-[#475569]"
            >
              AI Planning Based
            </Link>
          </div>

          {/*            GUEST MOBILE
           */}
          {!isLoggedIn && (
            <div className="mt-1 flex flex-col gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#64748b]">
                Akun
              </p>

              <Link
                href="/login"
                onClick={() => setIsDrawerOpen(false)}
                className="flex w-full items-center justify-center rounded-full bg-[#e8e2e7] px-4 py-3.5 font-semibold text-[#004796]"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={() => setIsDrawerOpen(false)}
                className="flex w-full items-center justify-center rounded-full bg-gradient-to-br from-[#004796] to-[#045ec2] px-4 py-3.5 font-semibold text-white"
              >
                Daftar
              </Link>
            </div>
          )}

          {/*            USER MOBILE
           */}
          {isLoggedIn && (
            <>
              {/* User Card */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-[#cac4cf]/45 bg-gradient-to-br from-[#004796]/[0.08] to-[#045ec2]/[0.04] px-4 py-3.5">
                <Image
                  src="/images/aset/avatar.jpg"
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover shadow-[0_8px_20px_rgba(14,23,68,0.12)]"
                />

                <div className="min-w-0">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#64748b]">
                    Akun Anda
                  </p>

                  <h3 className="truncate text-base font-extrabold text-[#111e3f]">
                    Robby
                  </h3>

                  <p className="text-xs text-[#475569]">Profil Customer</p>
                </div>
              </div>

              {/* User Actions */}
              <div className="mt-1 flex flex-col gap-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#64748b]">
                  Akun
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/material/cart"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-xl border border-[#cac4cf]/50 bg-[#f7f2f6] px-3 text-sm font-semibold text-[#111e3f]"
                  >
                    🛍️ Keranjang
                  </Link>

                  <Link
                    href="/customer/order"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-xl border border-[#cac4cf]/50 bg-[#f7f2f6] px-3 text-sm font-semibold text-[#111e3f]"
                  >
                    🛒 Pesanan
                  </Link>

                  <Link
                    href="/proyek"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-xl border border-[#cac4cf]/50 bg-[#f7f2f6] px-3 text-sm font-semibold text-[#111e3f]"
                  >
                    🏠 Proyek
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-xl border border-[#cac4cf]/50 bg-[#f7f2f6] px-3 text-sm font-semibold text-[#111e3f]"
                  >
                    👤 Profil
                  </Link>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#004796] to-[#045ec2] px-4 py-3.5 font-semibold text-white"
                  onClick={() => {
                    console.log("Logout");
                  }}
                >
                  ↪ Logout
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
