"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { houseDesigns } from "@/data/house-designs";

export type AiPreference = {
  location: string;
  style: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  garage: number;
  quality: number;
  flexibility: number;
  budget: number;
  priority: "biaya" | "estetik" | "cepat";
};

export type AiResult = {
  slug: string;
  match: number;
  factors: { label: string; score: number }[];
};

const LOCATIONS = [
  "Kota Bandung",
  "Kabupaten Bandung",
  "Kabupaten Bandung Barat",
  "Kota Cimahi",
  "Kabupaten Sumedang",
  "Kabupaten Garut",
  "Kota Tasikmalaya",
  "Kabupaten Tasikmalaya",
  "Kabupaten Cianjur",
  "Kota Sukabumi",
  "Kabupaten Sukabumi",
  "Kota Bogor",
  "Kabupaten Bogor",
  "Kota Depok",
  "Kota Bekasi",
  "Kabupaten Bekasi",
  "Kabupaten Karawang",
  "Kabupaten Purwakarta",
  "Kabupaten Subang",
  "Kabupaten Indramayu",
  "Kota Cirebon",
  "Kabupaten Cirebon",
  "Kabupaten Kuningan",
  "Kabupaten Majalengka",
  "Kabupaten Ciamis",
  "Kota Banjar",
  "Kabupaten Pangandaran",
];

const PRIORITIES = [
  { value: "biaya", label: "Efisiensi Biaya", description: "Rekomendasi paling hemat budget" },
  { value: "estetik", label: "Desain Estetik", description: "Gaya dan tampilan jadi prioritas" },
  { value: "cepat", label: "Konstruksi Cepat", description: "Durasi pengerjaan lebih singkat" },
] as const;

const money = (value: number) => `Rp ${(value / 1000000).toLocaleString("id-ID")} juta`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function generateRecommendations(preference: AiPreference): AiResult[] {
  const flexBudget = preference.budget * (1 + preference.flexibility / 100);
  const weights =
    preference.priority === "biaya"
      ? { budget: 0.35, area: 0.15, bedrooms: 0.12, style: 0.1, duration: 0.18, location: 0.1 }
      : preference.priority === "estetik"
        ? { budget: 0.15, area: 0.15, bedrooms: 0.1, style: 0.28, duration: 0.12, location: 0.2 }
        : { budget: 0.15, area: 0.15, bedrooms: 0.12, style: 0.1, duration: 0.38, location: 0.1 };

  return houseDesigns
    .map((design) => {
      const normalizeLocation = (value: string) => value.toLowerCase().replace(/^(kota|kabupaten)\s+/, "");
      const preferredLocation = normalizeLocation(preference.location);
      const locationScore = design.location.toLowerCase().includes(preferredLocation) || preferredLocation.includes(design.location.toLowerCase()) ? 100 : 40;
      const styleScore = design.style === preference.style ? 100 : 35;
      const areaScore = clamp(100 - Math.abs(design.landArea - preference.area) * 0.45, 0, 100);
      const bedroomScore = design.bedrooms === preference.bedrooms ? 100 : clamp(100 - Math.abs(design.bedrooms - preference.bedrooms) * 25, 0, 100);
      const budgetScore = design.estimatedCost <= preference.budget ? 100 : design.estimatedCost <= flexBudget ? 70 : 20;
      const durationScore = clamp(100 - design.estimatedDuration * 4, 0, 100);

      const match =
        locationScore * weights.location +
        styleScore * weights.style +
        areaScore * weights.area +
        bedroomScore * weights.bedrooms +
        budgetScore * weights.budget +
        durationScore * weights.duration;

      const factors: AiResult["factors"] = [
        { label: "Kesesuaian area", score: Math.round(areaScore) },
        { label: "Jumlah kamar", score: Math.round(bedroomScore) },
        { label: "Kesesuaian budget", score: Math.round(budgetScore) },
      ];
      if (preference.priority === "cepat") {
        factors.push({ label: "Durasi pengerjaan", score: Math.round(durationScore) });
      } else {
        factors.push({ label: "Gaya arsitektur", score: Math.round(styleScore) });
      }

      return { slug: design.slug, match: Math.round(match), factors };
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, 6);
}

function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-[#111e3f]">
          {label}
        </label>
        <span className="text-sm font-bold text-[#004796]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-slider"
        style={{ ["--range-progress" as string]: `${progress}%` }}
      />
      <div className="mt-2 flex justify-between text-xs text-[#64748b]">
        <span>{min >= 100000000 ? "Rp 100 jt" : `${min} m²`}</span>
        <span>{max >= 100000000 ? "Rp 2 M" : `${max} m²`}</span>
      </div>
    </div>
  );
}

export default function PreferenceForm() {
  const router = useRouter();
  const formRef = useRef<HTMLElement>(null);
  const styles = useMemo(() => [...new Set(houseDesigns.map((design) => design.style))], []);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [style, setStyle] = useState(styles[0]);
  const [area, setArea] = useState(30);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [garage, setGarage] = useState(0);
  const [quality, setQuality] = useState(5);
  const [flexibility, setFlexibility] = useState(10);
  const [budget, setBudget] = useState(100000000);
  const [priority, setPriority] = useState<AiPreference["priority"]>("biaya");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    const preference: AiPreference = {
      location,
      style,
      area,
      bedrooms,
      bathrooms,
      garage,
      quality,
      flexibility,
      budget,
      priority,
    };
    setSubmitting(true);
    setTimeout(() => {
      localStorage.setItem("w2h_ai_preferensi", JSON.stringify(preference));
      localStorage.setItem("w2h_ai_hasil", JSON.stringify(generateRecommendations(preference)));
      router.push("/ai-planning-based/hasil");
    }, 700);
  };

  const numberField = (id: string, label: string, value: number, setter: (value: number) => void, min: number, max: number, hint: string) => (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#111e3f]">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => setter(clamp(Number(event.target.value) || min, min, max))}
        className="mt-2 w-full rounded-xl border border-[#dbe4f2] bg-white px-4 py-3 text-sm font-semibold text-[#111e3f] outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
      />
      <p className="mt-1.5 text-xs text-[#64748b]">{hint}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 text-[#111e3f]">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#111e3f] pt-18 text-white md:pt-18">
        <div className="absolute inset-0 -z-20 bg-[url('/images/aset/construction.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 -z-10 bg-[#111e3f]/80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08152f]/95 via-[#111e3f]/70 to-[#004796]/40" />
        <div className="mx-auto grid max-w-screen-2xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb9ed]/40 bg-[#eef5ff]/10 px-4 py-1.5 text-xs font-bold tracking-wide text-[#b9d8ff]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#fcd47c]" />
              K-Nearest Neighbors · Weighted Euclidean Distance
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] md:text-6xl">
              AI Planning Based
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75 md:text-lg">
              Ceritakan rumah impian Anda. Sistem rekomendasi kami membandingkan preferensi Anda dengan koleksi desain Way2Home menggunakan perhitungan kemiripan KNN, lalu menyajikan desain yang paling mendekati kebutuhan — dari budget, luas, hingga gaya arsitektur.
            </p>
            <button
              type="button"
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#fcd47c] px-8 py-4 text-base font-bold text-[#2b3361] shadow-[0_10px_30px_rgba(252,212,124,0.35)] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            >
              Input Kebutuhan Rumah
            </button>
          </div>
          <div className="relative hidden lg:block">
            <div className="overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.4)]">
              <Image
                src="/images/aset/construction.jpg"
                alt="Ilustrasi rumah dan konstruksi"
                width={520}
                height={420}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-white/20 bg-white/95 px-6 py-4 shadow-xl backdrop-blur">
              <p className="text-xs font-semibold text-[#64748b]">Jawa Barat</p>
              <p className="mt-0.5 text-lg font-bold text-[#111e3f]">Siap Membangun</p>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section ref={formRef} className="mx-auto scroll-mt-24 max-w-4xl px-6 lg:px-8">
        <div className="-mt-8 rounded-[2rem] border border-[#dbe4f2] bg-white p-8 pt-10 shadow-[0_20px_50px_rgba(17,30,63,0.08)] md:p-12 md:pt-16">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#111e3f] md:text-3xl">
            Form Rekomendasi Rumah
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            Sesuaikan kebutuhan Anda pada kolom berikut, lalu sistem akan menyusun rekomendasi desain terbaik.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="pref-location" className="text-sm font-semibold text-[#111e3f]">
                Preferensi lokasi
              </label>
              <select
                id="pref-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full cursor-pointer appearance-none rounded-xl border border-[#dbe4f2] bg-white bg-[url('/images/icon/down.png')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat px-4 py-3 text-sm font-semibold text-[#111e3f] outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
              >
                {LOCATIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pref-style" className="text-sm font-semibold text-[#111e3f]">
                Gaya arsitektur
              </label>
              <select
                id="pref-style"
                value={style}
                onChange={(event) => setStyle(event.target.value)}
                className="mt-2 w-full cursor-pointer appearance-none rounded-xl border border-[#dbe4f2] bg-white bg-[url('/images/icon/down.png')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat px-4 py-3 text-sm font-semibold text-[#111e3f] outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
              >
                {styles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <RangeSlider id="pref-area" label="Estimasi area rumah" value={area} min={25} max={350} step={5} display={`${area} m²`} onChange={setArea} />
            {numberField("pref-bedrooms", "Jumlah kamar tidur", bedrooms, setBedrooms, 1, 6, "Maksimal 6 kamar")}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {numberField("pref-bathrooms", "Jumlah kamar mandi", bathrooms, setBathrooms, 1, 3, "Maksimal 3 kamar mandi")}
            {numberField("pref-garage", "Jumlah garasi", garage, setGarage, 0, 5, "0 - 5 slot kendaraan")}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {numberField("pref-quality", "Kualitas desain", quality, setQuality, 1, 10, "Skala 1 - 10")}
            {numberField("pref-flexibility", "Fleksibilitas budget", flexibility, setFlexibility, 0, 50, "% dari budget")}
          </div>

          <div className="mt-8">
            <RangeSlider id="pref-budget" label="Estimasi budget" value={budget} min={100000000} max={2000000000} step={25000000} display={money(budget)} onChange={setBudget} />
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold text-[#111e3f]">Prioritas preferensi</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PRIORITIES.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setPriority(item.value)}
                  aria-pressed={priority === item.value}
                  className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition ${priority === item.value
                    ? "border-[#004796] bg-[#eef5ff] shadow-[0_8px_20px_rgba(0,71,150,0.15)]"
                    : "border-[#dbe4f2] bg-white hover:border-[#8fb9ed]"
                    }`}
                >
                  <p className="mt-3 font-bold text-[#111e3f]">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="mt-10 min-h-14 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 text-base font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Menganalisis preferensi..." : "Buat Rekomendasi"}
          </button>
          <p className="mt-4 text-center text-sm text-[#64748b]">
            Sistem akan membandingkan preferensi Anda dengan {houseDesigns.length} desain rumah Way2Home.
          </p>
        </div>
      </section>
    </main>
  );
}
