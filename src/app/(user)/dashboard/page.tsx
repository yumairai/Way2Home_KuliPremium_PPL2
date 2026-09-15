"use client";

import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#fffbfe] pb-20 pt-32 text-[#1c1b1f]">
      {/*HERO SECTION*/}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-8 lg:grid-cols-12">
        {/*
            HERO CONTENT
     */}
        <div className="flex flex-col gap-8 lg:col-span-7">
          {/* Badge */}
          <div className="flex w-fit items-center gap-2 rounded-full border border-[#cac4cf]/15 bg-[#f7f2f6] px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ffd8e4]" />

            <span className="text-sm font-medium uppercase tracking-[0.1em] text-[#49454e]">
              Platform Konstruksi Digital
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-[-0.025em] text-[#1c1b1f] md:text-7xl">
            Bangun Hunian
            <br />
            <span className="bg-gradient-to-br  pr-2 from-[#004796] to-[#045ec2] bg-clip-text italic text-transparent">
              Masa Depan
            </span>{" "}
            Anda.
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-lg leading-7 text-[#49454e] md:text-xl md:leading-8">
            Way2Home adalah platform konstruksi digital terintegrasi yang
            dirancang untuk mempermudah proses pembangunan hunian impian Anda di
            wilayah Jawa Barat. Kami menghubungkan Anda dengan pengadaan
            material bangunan premium serta tenaga ahli profesional melalui
            sistem yang transparan dan efisien.
          </p>

          {/*
              ACTION BUTTONS
         */}
          <div className="flex flex-wrap gap-4 pt-4">
            {/* Mulai Belanja */}
            <Link
              href="/ai-planning-based"
              className="group flex items-center gap-3 rounded-full bg-gradient-to-br from-[#004796] to-[#045ec2] px-8 py-4 text-lg font-semibold text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,71,150,0.4)] active:scale-95"
            >
              <span>Mulai Bangun Rumah</span>

              <Image
                src="/images/icon/shopping-cart.png"
                alt="Shopping Cart"
                width={30}
                height={30}
                className="brightness-0 invert"
              />
            </Link>

            {/* Rekomendasi Desain */}
            <Link
              href="/design"
              className="flex items-center gap-3 rounded-full bg-[#e8e2e7] px-8 py-4 text-lg font-semibold text-[#004796] transition duration-300 hover:bg-[#ede7eb] active:scale-95"
            >
              <span>Desain Rumah</span>

              <Image
                src="/images/icon/house.png"
                alt="Rekomendasi Desain"
                width={30}
                height={30}
              />
            </Link>
          </div>
        </div>

        {/*
            HERO VISUAL
     */}
        <div className="relative flex h-[600px] items-center justify-center lg:col-span-5">
          {/* Background Shape */}
          <div className="absolute inset-0 scale-[0.95] rotate-[-6deg] rounded-[4rem] bg-[#e8f4fe]/30" />

          {/*
              BACK IMAGE
         */}
          <div className="absolute right-0 top-0 z-10 h-[400px] w-[80%] translate-x-4 -translate-y-4 overflow-hidden rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.1)]">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMbK8UauEiIDTik98DtzjmaNyaTjNqS4LBR0tSHhRFFzy89fDk-qwTH4eCDFUZ3BsYohl4EW2ta5zd8qkt28Lq0EzyM3aK4iffhsHw4L3lXV7r-SJ9Vrb_9eQWt0jdiAkdPMjDovxOfH6U9PhWHokvHLyrKCee0JCBwZZzvc2VBpum1Cj6XG6-6asRGad3dtDZhFb40b8AxGUHJrhEnQ6jnG6o2UyhxDCu62-9iYzLTsF9hyf9wiAO2q3CkXOp_J0AYnYDAdtCtxA"
              alt="Modern architecture"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/*
              FRONT IMAGE
         */}
          <div className="absolute bottom-0 left-0 z-20 h-[400px] w-[80%] -translate-x-4 translate-y-4 overflow-hidden rounded-3xl border-[8px] border-[#fffbfe] shadow-[0_25px_50px_rgba(0,0,0,0.1)]">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfmLEeisbpET-Lz2AiJaycDoH8dwnGAUcp3ghYim2R3p4K4NRu6do42oQTK4k3Eyz3RJDIfZ6woVUjFFrCOMY8xC4d8j-kBaw73vXuqJVg7ynuthNdbIbpv8fWOwj_OuAZBLPAlOZdTf7zOMmoJF8LL0AknDtnX1w-cFUcN9Fexiqy5A2eoa4n1osyRJilMalbrkjw31iz_THOyHHFIQ9NSglFgO8feRNOLuh_AJTSdXhSkmbz2PFjrpfE-1ZBDRaMSfJCtcZdaug"
              alt="Modern house detail"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/*
              FLOATING BADGE
         */}
          <div className="absolute -bottom-10 right-10 z-30 flex items-center gap-4 rounded-2xl border border-[#cac4cf]/10 bg-white p-6 shadow-[0_20px_25px_rgba(0,0,0,0.1)]">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7d5260]/10">
              <Image
                src="/images/icon/verified.png"
                alt="Verified Icon"
                width={25}
                height={25}
              />
            </div>

            {/* Text */}
            <div>
              <h4 className="mb-1 font-bold text-[#1c1b1f]">Jawa Barat</h4>

              <p className="text-xs font-medium text-[#49454e]">
                Layanan Terintegrasi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*
          FEATURES SECTION
     */}
      <section className="mx-auto mt-40 max-w-7xl px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/*
              FEATURE 1
         */}
          <div className="flex flex-col gap-6 rounded-[2rem] bg-[#f7f2f6] p-8">
            <Image
              src="/images/icon/bricks.png"
              alt="Premium Material"
              width={45}
              height={45}
            />

            <h3 className="text-2xl font-bold text-[#1c1b1f]">
              Material Bangunan Premium
            </h3>

            <p className="text-[#49454e]">
              Akses langsung ke produsen material terbaik dengan standar
              kualitas tinggi untuk daya tahan bangunan maksimal.
            </p>
          </div>

          {/*
              FEATURE 2
         */}
          <div className="flex flex-col gap-6 rounded-[2rem] bg-[#f3eef2] p-8">
            <Image
              src="/images/icon/businessman.png"
              alt="Professional Expert"
              width={45}
              height={45}
            />

            <h3 className="text-2xl font-bold text-[#1c1b1f]">
              Tenaga Ahli Profesional
            </h3>

            <p className="text-[#49454e]">
              Bekerja sama dengan arsitek dan kontraktor berlisensi yang
              berpengalaman mewujudkan desain hunian kompleks.
            </p>
          </div>

          {/*
              FEATURE 3
         */}
          <div className="flex flex-col gap-6 rounded-[2rem] bg-[#e8e2e7] p-8">
            <Image
              src="/images/icon/transparan.png"
              alt="Transparency"
              width={45}
              height={45}
            />

            <h3 className="text-2xl font-bold text-[#1c1b1f]">
              Sistem Transparan
            </h3>

            <p className="text-[#49454e]">
              Lacak progres pembangunan Anda secara real-time dengan laporan
              digital yang transparan dan akurat.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
