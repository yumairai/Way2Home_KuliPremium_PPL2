import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-[#ececff] py-12">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-8 md:flex-row md:items-center md:justify-between">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
          <div className="flex items-center gap-2">
            <Image
              src="/images/aset/logo-w2h.png"
              alt="Logo Way2Home"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />

            <span className="text-xl font-bold text-[#111e3f]">Way2Home</span>
          </div>

          <p className="text-sm font-normal text-slate-500">
            Platform konstruksi digital untuk pembangunan rumah, renovasi, dan
            material.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-8">
          <Link
            href="/"
            className="text-sm text-slate-500 transition-colors duration-200 hover:text-orange-600"
          >
            Beranda
          </Link>

          <Link
            href="/recommendation"
            className="text-sm text-slate-500 transition-colors duration-200 hover:text-orange-600"
          >
            Desain
          </Link>

          <Link
            href="/material"
            className="text-sm text-slate-500 transition-colors duration-200 hover:text-orange-600"
          >
            Ai Planning Based
          </Link>

          <a
            href="https://wa.me/6281384310179"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 transition-colors duration-200 hover:text-orange-600"
          >
            Kontak
          </a>
        </div>

        {/* WhatsApp */}
        <div className="flex gap-4">
          <a
            href="https://wa.me/6281384310179"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hubungi Way2Home via WhatsApp"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#e0e0f5] transition-all duration-200 hover:bg-[#d5d5ec]"
          >
            <Image
              src="/images/icon/whatsapp.png"
              alt="WhatsApp"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
