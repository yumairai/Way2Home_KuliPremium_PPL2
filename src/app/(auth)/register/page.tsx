import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Daftar | Way2Home",
  description: "Pilih jenis akun Way2Home untuk melanjutkan pendaftaran.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col-reverse lg:flex-row">
      <section className="relative flex w-full items-center justify-center overflow-hidden px-5 py-10 lg:w-[65%] lg:px-10">
        <div className="absolute inset-0">
          <Image
            src="/images/aset/construction2.jpg"
            alt="Proyek pembangunan rumah"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#045ec2]/35" />
        </div>
        <div className="relative z-10 w-full max-w-3xl rounded-[18px] border border-white/70 bg-[#ebfaff] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)] sm:p-10">
          <Link
            href="/login"
            className="text-sm font-medium text-[#045ec2] hover:underline"
          >
            Kembali ke login
          </Link>
          <h1 className="mt-5 text-3xl font-bold text-[#2B3361] sm:text-4xl">
            Mulai bersama Way2Home
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Pilih jenis akun yang sesuai. Anda dapat mengelola pembangunan rumah
            atau bergabung sebagai mitra mandor.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="flex flex-col rounded-xl border border-[#c8d8e7] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#2B3361]">
                Saya ingin membangun
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                Buat akun pelanggan untuk merencanakan dan memantau pembangunan
                rumah Anda.
              </p>
              <Link
                href="/register/customer"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2B3361] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#21274b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2]"
              >
                Daftar sebagai pelanggan
              </Link>
            </article>
            <article className="flex flex-col rounded-xl border border-[#c8d8e7] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#2B3361]">
                Saya ingin menjadi mitra
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                Daftarkan pengalaman dan keahlian Anda sebagai mandor untuk
                bergabung dengan Way2Home.
              </p>
              <Link
                href="/register/mandor"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#004796] px-5 py-3 text-sm font-semibold text-[#004796] transition-colors hover:bg-[#edf6ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2]"
              >
                Daftar sebagai mitra mandor
              </Link>
            </article>
          </div>
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
