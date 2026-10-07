"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const DEFAULT_USER = {
  name: "Budi Santoso",
  phone: "081234567890",
  email: "budi.santoso@email.com",
  address: "Jl. Merdeka No. 123, Bandung, Jawa Barat",
};

function Field({
  id,
  label,
  icon,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-[#111e3f]">
        <span className="text-[#004796]">{icon}</span>
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="mt-2 w-full rounded-xl border border-[#dbe4f2] bg-white px-4 py-3 text-sm font-medium text-[#111e3f] outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
      />
    </div>
  );
}

export default function ProfileEdit() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(DEFAULT_USER.name);
  const [phone, setPhone] = useState(DEFAULT_USER.phone);
  const [email, setEmail] = useState(DEFAULT_USER.email);
  const [address, setAddress] = useState(DEFAULT_USER.address);
  const [avatarPreview, setAvatarPreview] = useState("/images/aset/avatar.jpg");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty =
    name !== DEFAULT_USER.name ||
    phone !== DEFAULT_USER.phone ||
    email !== DEFAULT_USER.email ||
    address !== DEFAULT_USER.address ||
    avatarFile !== null;

  const handleAvatarChange = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Ukuran foto maksimal 2MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setAvatarError("Format foto harus JPG atau PNG.");
      return;
    }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const handleSubmit = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f7f9fc] pb-24 pt-32 text-[#111e3f]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-32 top-40 h-[32rem] w-[28rem] rounded-full bg-[#eef5ff] opacity-60 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-24 bottom-10 h-[24rem] w-[20rem] rounded-full bg-[#f3eef2] opacity-40 blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569] transition hover:text-[#004796] transition-transform duration-300 hover:translate-x-2 active:scale-95"
        >
          <span aria-hidden="true" className="text-[#004796] transition-transform group-hover:-translate-x-1">←</span>
          Kembali ke Dashboard
        </Link>

        {saved && (
          <div role="status" className="mt-6 rounded-2xl border border-[#059669] bg-[#ecfdf5] p-4 text-sm font-semibold text-[#065f46]">
            Profil berhasil diperbarui.
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#dbe4f2] bg-white shadow-[0_24px_48px_rgba(17,30,63,0.06)]">
          <div className="p-8 md:p-12">
            <header className="text-center">
              <h1 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">Edit Profile</h1>
              <p className="mx-auto mt-3 max-w-md leading-7 text-[#64748b]">
                Perbarui informasi personal dan preferensi akun Anda.
              </p>
            </header>

            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="relative inline-flex">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#eef5ff] bg-[#f1f5f9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Ganti foto profil"
                  className="absolute bottom-0 left-24 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#004796] text-white shadow-lg transition hover:bg-[#045ec2] active:scale-90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpg,image/jpeg,image/png"
                  className="hidden"
                  onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                />
              </div>
              {avatarError ? (
                <p className="text-sm font-semibold text-[#dc2626]">{avatarError}</p>
              ) : (
                <p className="text-sm text-[#64748b]">jpg/png maks 2MB</p>
              )}
            </div>

            <div className="mt-12 space-y-8">
              <Field
                id="profile-name"
                label="Nama Lengkap"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <div className="grid gap-8 sm:grid-cols-2">
                <Field
                  id="profile-phone"
                  label="Nomor HP"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  }
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <Field
                  id="profile-email"
                  label="Email"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  }
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="profile-address" className="flex items-center gap-2 text-sm font-semibold text-[#111e3f]">
                  <span className="text-[#004796]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  Alamat
                </label>
                <textarea
                  id="profile-address"
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="mt-2 w-full resize-y rounded-xl border border-[#dbe4f2] bg-white px-4 py-3 text-sm font-medium text-[#111e3f] outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
                />
              </div>
            </div>

            <div className="mt-12 text-center">
              <button
                type="button"
                disabled={!dirty}
                onClick={handleSubmit}
                className="inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-10 text-base font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ubah Profile
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 0 2.8l-9.9 9.9a4 4 0 0 1-1.4.9l-4.3 1.2a1 1 0 0 1-1.2-1.2l1.2-4.3a4 4 0 0 1 .9-1.4l9.9-9.9a2 2 0 0 1 1.4-.6Z" />
                  <path d="M13 5.5 18.5 11" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
