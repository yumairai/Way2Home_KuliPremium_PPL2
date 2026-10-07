"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { houseDesigns } from "@/data/house-designs";
import type { AiPreference, AiResult } from "@/components/ai/PreferenceForm";

const money = (value: number) => `Rp ${(value / 1000000).toLocaleString("id-ID")} juta`;

const priorityLabels: Record<AiPreference["priority"], string> = {
  biaya: "Efisiensi Biaya",
  estetik: "Desain Estetik",
  cepat: "Konstruksi Cepat",
};

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function AiResults() {
  const [preference] = useState<AiPreference | null>(() => readStored<AiPreference | null>("w2h_ai_preferensi", null));
  const [results] = useState<AiResult[]>(() => readStored<AiResult[]>("w2h_ai_hasil", []));

  const matchColor = (score: number) => (score >= 70 ? "text-[#059669]" : score >= 50 ? "text-[#d97706]" : "text-[#dc2626]");
  const matchBar = (score: number) => (score >= 70 ? "bg-[#059669]" : score >= 50 ? "bg-[#f59e0b]" : "bg-[#dc2626]");

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 pt-32 text-[#111e3f]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb9ed]/40 bg-[#eef5ff] px-4 py-1.5 text-xs font-bold text-[#004796]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#004796]" />
              K-Nearest Neighbors · Weighted Euclidean Distance
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] md:text-5xl">Rekomendasi rumah untuk Anda</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748b]">
              Enam desain dengan kecocokan tertinggi terhadap preferensi Anda. Skor dihitung dari kedekatan fitur budget, luas, kamar, gaya, lokasi, dan durasi pembangunan.
            </p>
          </div>
          <Link
            href="/ai-planning-based"
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-[#dbe4f2] bg-white px-6 py-3 text-sm font-bold text-[#475569] transition hover:-translate-y-0.5 hover:border-[#8fb9ed] hover:bg-[#eef5ff]"
          >
            Ubah preferensi
          </Link>
        </div>

        {preference && (
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#111e3f] px-4 py-1.5 text-xs font-semibold text-white">Lokasi: {preference.location}</span>
            <span className="rounded-full bg-[#111e3f] px-4 py-1.5 text-xs font-semibold text-white">Gaya: {preference.style}</span>
            <span className="rounded-full bg-[#111e3f] px-4 py-1.5 text-xs font-semibold text-white">Luas: {preference.area} m²</span>
            <span className="rounded-full bg-[#111e3f] px-4 py-1.5 text-xs font-semibold text-white">Kamar: {preference.bedrooms}</span>
            <span className="rounded-full bg-[#111e3f] px-4 py-1.5 text-xs font-semibold text-white">Budget: {money(preference.budget)}</span>
            <span className="rounded-full bg-[#fcd47c] px-4 py-1.5 text-xs font-bold text-[#2b3361]">Prioritas: {priorityLabels[preference.priority]}</span>
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map((result, index) => {
            const design = houseDesigns.find((item) => item.slug === result.slug);
            if (!design) return null;
            return (
              <article
                key={result.slug}
                className="group overflow-hidden rounded-[2rem] border border-[#dbe4f2] bg-white shadow-[0_12px_30px_rgba(17,30,63,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(17,30,63,0.1)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={design.image}
                    alt={`Desain rumah ${design.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-[#111e3f]/85 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
                    Desain #{index + 1}
                  </span>
                  <span className={`absolute right-4 top-4 rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold backdrop-blur ${matchColor(result.match)}`}>
                    {result.match}% Match
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#045ec2]">{design.style}</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em]">{design.name}</h2>
                  <p className="mt-2 text-sm text-[#64748b]">{design.location}</p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                    <div className={`h-full rounded-full ${matchBar(result.match)}`} style={{ width: `${result.match}%` }} />
                  </div>

                  <dl className="mt-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[#64748b]">Luas tanah/bangunan</dt>
                      <dd className="font-bold">{design.landArea} / {design.buildingArea} m²</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#64748b]">Kamar</dt>
                      <dd className="font-bold">{design.bedrooms} kamar · {design.floors} lantai</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#64748b]">Estimasi biaya</dt>
                      <dd className="font-bold text-[#004796]">{money(design.estimatedCost)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#64748b]">Durasi</dt>
                      <dd className="font-bold">{design.estimatedDuration} bulan</dd>
                    </div>
                  </dl>

                  <div className="mt-5 space-y-1.5 rounded-2xl bg-[#f7f9fc] p-4">
                    {result.factors.map((factor) => (
                      <div key={factor.label} className="flex items-center justify-between text-xs">
                        <span className="text-[#64748b]">{factor.label}</span>
                        <span className="font-bold">{factor.score}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link
                      href={`/katalog/${design.slug}`}
                      className="cursor-pointer rounded-full border border-[#dbe4f2] px-4 py-3 text-center text-sm font-bold text-[#475569] transition hover:border-[#8fb9ed] hover:bg-[#eef5ff]"
                    >
                      Lihat detail
                    </Link>
                    <Link
                      href={`/bangun/${design.slug}`}
                      className="cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Pilih desain
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {results.length === 0 && (
          <div className="mt-16 rounded-[2rem] border border-dashed border-[#b8c7dc] bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-bold">Belum ada hasil rekomendasi</h2>
            <p className="mt-3 text-[#64748b]">Lengkapi preferensi Anda terlebih dahulu, lalu sistem akan menyusun rekomendasi terbaik.</p>
            <Link
              href="/ai-planning-based"
              className="mt-8 inline-flex cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Mulai isi preferensi
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
