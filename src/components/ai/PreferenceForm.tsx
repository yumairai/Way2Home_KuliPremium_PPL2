"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { houseDesigns } from "@/data/house-designs";
import { toDatabaseLocation, UI_LOCATIONS } from "@/data/location-mapping";
import type {
  RecommendationInput,
  RecommendationResponse,
} from "@/services/recommendation.service";

export type AiPreference = RecommendationInput;

const PRIORITIES = [
  {
    value: "biaya",
    label: "Efisiensi Biaya",
    description: "Rekomendasi paling hemat budget",
  },
  {
    value: "estetik",
    label: "Desain Estetik",
    description: "Gaya dan tampilan jadi prioritas",
  },
  {
    value: "cepat",
    label: "Konstruksi Cepat",
    description: "Durasi pengerjaan lebih singkat",
  },
] as const;

const money = (value: number) =>
  `Rp ${(value / 1000000).toLocaleString("id-ID")} juta`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  const fallbackStyles = useMemo(
    () => [...new Set(houseDesigns.map((design) => design.style))],
    [],
  );
  const [styles, setStyles] = useState(fallbackStyles);
  const [designCount, setDesignCount] = useState(houseDesigns.length);
  const [location, setLocation] = useState<string>(UI_LOCATIONS[0]);
  const [style, setStyle] = useState(fallbackStyles[0] ?? "");
  const [area, setArea] = useState(30);
  const [bedrooms, setBedrooms] = useState(1);
  const [floors, setFloors] = useState(1);
  const [flexibility, setFlexibility] = useState(10);
  const [budget, setBudget] = useState(100000000);
  const [priority, setPriority] =
    useState<RecommendationInput["priority"]>("biaya");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/designs")
      .then(async (response) => {
        if (!response.ok) throw new Error("Katalog desain gagal dimuat.");
        return (await response.json()) as Array<{ style: string }>;
      })
      .then((designs) => {
        if (!active) return;
        const availableStyles = [
          ...new Set(designs.map((design) => design.style).filter(Boolean)),
        ];
        if (availableStyles.length > 0) {
          setStyles(availableStyles);
          setDesignCount(designs.length);
          setStyle((current) =>
            availableStyles.includes(current) ? current : availableStyles[0],
          );
        }
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat opsi gaya desain:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    const preference: RecommendationInput = {
      location,
      style,
      area,
      bedrooms,
      floors,
      flexibility,
      budget,
      priority,
    };
    const requestInput: RecommendationInput = {
      ...preference,
      location: toDatabaseLocation(preference.location),
    };
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestInput),
      });
      const payload = (await response.json()) as
        RecommendationResponse | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Rekomendasi gagal dibuat.",
        );
      }

      localStorage.setItem("w2h_ai_preferensi", JSON.stringify(preference));
      localStorage.setItem("w2h_ai_rekomendasi", JSON.stringify(payload));
      router.push("/ai-planning-based/hasil");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Rekomendasi gagal dibuat.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const numberField = (
    id: string,
    label: string,
    value: number,
    setter: (value: number) => void,
    min: number,
    max: number,
    hint: string,
  ) => (
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
        onChange={(event) =>
          setter(clamp(Number(event.target.value) || min, min, max))
        }
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
              Ceritakan rumah impian Anda. Sistem rekomendasi kami membandingkan
              preferensi Anda dengan koleksi desain Way2Home menggunakan
              perhitungan kemiripan KNN, lalu menyajikan desain yang paling
              mendekati kebutuhan — dari budget, luas, hingga gaya arsitektur.
            </p>
            <button
              type="button"
              onClick={() =>
                formRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
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
              <p className="mt-0.5 text-lg font-bold text-[#111e3f]">
                Siap Membangun
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section
        ref={formRef}
        className="mx-auto scroll-mt-24 max-w-4xl px-6 lg:px-8"
      >
        <div className="-mt-8 rounded-[2rem] border border-[#dbe4f2] bg-white p-8 pt-10 shadow-[0_20px_50px_rgba(17,30,63,0.08)] md:p-12 md:pt-16">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#111e3f] md:text-3xl">
            Form Rekomendasi Rumah
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            Sesuaikan kebutuhan Anda pada kolom berikut, lalu sistem akan
            menyusun rekomendasi desain terbaik.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pref-location"
                className="text-sm font-semibold text-[#111e3f]"
              >
                Preferensi lokasi
              </label>
              <select
                id="pref-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full cursor-pointer appearance-none rounded-xl border border-[#dbe4f2] bg-white bg-[url('/images/icon/down.png')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat px-4 py-3 text-sm font-semibold text-[#111e3f] outline-none transition focus:border-[#8fb9ed] focus:ring-2 focus:ring-[#045ec2]/20"
              >
                {UI_LOCATIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="pref-style"
                className="text-sm font-semibold text-[#111e3f]"
              >
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
            <RangeSlider
              id="pref-area"
              label="Luas lahan tersedia"
              value={area}
              min={25}
              max={350}
              step={5}
              display={`${area} m²`}
              onChange={setArea}
            />
            {numberField(
              "pref-bedrooms",
              "Jumlah kamar tidur",
              bedrooms,
              setBedrooms,
              1,
              6,
              "Maksimal 6 kamar",
            )}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {numberField(
              "pref-floors",
              "Jumlah lantai",
              floors,
              setFloors,
              1,
              3,
              "Maksimal 3 lantai",
            )}
            {numberField(
              "pref-flexibility",
              "Fleksibilitas budget",
              flexibility,
              setFlexibility,
              0,
              50,
              "% dari budget",
            )}
          </div>

          <div className="mt-8">
            <RangeSlider
              id="pref-budget"
              label="Estimasi budget"
              value={budget}
              min={100000000}
              max={2000000000}
              step={25000000}
              display={money(budget)}
              onChange={setBudget}
            />
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold text-[#111e3f]">
              Prioritas preferensi
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PRIORITIES.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setPriority(item.value)}
                  aria-pressed={priority === item.value}
                  className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition ${
                    priority === item.value
                      ? "border-[#004796] bg-[#eef5ff] shadow-[0_8px_20px_rgba(0,71,150,0.15)]"
                      : "border-[#dbe4f2] bg-white hover:border-[#8fb9ed]"
                  }`}
                >
                  <p className="mt-3 font-bold text-[#111e3f]">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={submitting || !style}
            onClick={handleSubmit}
            className="mt-10 min-h-14 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 text-base font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Menganalisis preferensi..." : "Buat Rekomendasi"}
          </button>
          {submitError && (
            <p role="alert" className="mt-3 text-center text-sm text-red-700">
              {submitError}
            </p>
          )}
          <p className="mt-4 text-center text-sm text-[#64748b]">
            Sistem akan membandingkan preferensi Anda dengan {designCount}{" "}
            desain rumah Way2Home.
          </p>
        </div>
      </section>
    </main>
  );
}
