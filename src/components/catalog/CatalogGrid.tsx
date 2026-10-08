"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import DesignCard from "@/components/catalog/DesignCard";
import { houseDesigns } from "@/data/house-designs";

const PAGE_SIZE = 6;
const priceRanges = [
  { label: "Semua harga", min: 0, max: Infinity },
  { label: "Di bawah Rp700 juta", min: 0, max: 700000000 },
  { label: "Rp700 juta–Rp1 miliar", min: 700000000, max: 1000000000 },
  { label: "Rp1–1,5 miliar", min: 1000000000, max: 1500000000 },
  { label: "Di atas Rp1,5 miliar", min: 1500000000, max: Infinity },
];
const landRanges = [
  { label: "Semua luas tanah", min: 0, max: Infinity },
  { label: "Di bawah 100 m²", min: 0, max: 100 },
  { label: "100–150 m²", min: 100, max: 150 },
  { label: "151–200 m²", min: 151, max: 200 },
  { label: "Di atas 200 m²", min: 201, max: Infinity },
];
const buildingRanges = [
  { label: "Semua luas bangunan", min: 0, max: Infinity },
  { label: "Di bawah 70 m²", min: 0, max: 70 },
  { label: "70–100 m²", min: 70, max: 100 },
  { label: "101–150 m²", min: 101, max: 150 },
  { label: "Di atas 150 m²", min: 151, max: Infinity },
];

function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
  open,
  onOpenChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onOpenChange]);
  return (
    <div ref={containerRef} className="relative">
      <span className="mb-2 block text-sm font-semibold text-[#111e3f]">
        {label}
      </span>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-[#dbe4f2] bg-white px-3 text-left text-sm text-[#475569] transition hover:border-[#8fb9ed] focus:outline-none focus:ring-2 focus:ring-[#045ec2]/20"
      >
        <span>{value}</span>
        <span
          className={`transition duration-150 ${open ? "scale-110 opacity-100" : "scale-100 opacity-50"}`}
        >
          <img
            src="/images/icon/down.png"
            alt=""
            className="h-5 w-5 object-contain"
          />
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-[#dbe4f2] bg-white p-1 shadow-[0_18px_35px_rgba(17,30,63,0.14)]"
        >
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option === value}
              key={option}
              onClick={() => {
                onChange(option);
                onOpenChange(false);
              }}
              className={`block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-[#eef5ff] ${option === value ? "bg-[#eef5ff] font-bold text-[#004796]" : "text-[#475569]"}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogGrid() {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState("Semua gaya");
  const [price, setPrice] = useState(priceRanges[0].label);
  const [land, setLand] = useState(landRanges[0].label);
  const [building, setBuilding] = useState(buildingRanges[0].label);
  const [bedrooms, setBedrooms] = useState("Semua kamar");
  const [sort, setSort] = useState("Rekomendasi");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const setSelectOpen = (id: string, open: boolean) =>
    setOpenSelect(open ? id : null);
  const styles = [
    "Semua gaya",
    ...new Set(houseDesigns.map((design) => design.style)),
  ];
  const priceRange =
    priceRanges.find((item) => item.label === price) ?? priceRanges[0];
  const landRange =
    landRanges.find((item) => item.label === land) ?? landRanges[0];
  const buildingRange =
    buildingRanges.find((item) => item.label === building) ?? buildingRanges[0];
  const filtered = useMemo(() => {
    const result = houseDesigns.filter(
      (design) =>
        `${design.name} ${design.style} ${design.location}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (style === "Semua gaya" || design.style === style) &&
        design.estimatedCost >= priceRange.min &&
        design.estimatedCost <= priceRange.max &&
        design.landArea >= landRange.min &&
        design.landArea <= landRange.max &&
        design.buildingArea >= buildingRange.min &&
        design.buildingArea <= buildingRange.max &&
        (bedrooms === "Semua kamar" ||
          (bedrooms === "4 kamar atau lebih"
            ? design.bedrooms >= 4
            : design.bedrooms === Number(bedrooms[0]))),
    );
    return [...result].sort((a, b) =>
      sort === "Harga terendah"
        ? a.estimatedCost - b.estimatedCost
        : sort === "Harga tertinggi"
          ? b.estimatedCost - a.estimatedCost
          : 0,
    );
  }, [buildingRange, bedrooms, landRange, priceRange, query, sort, style]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const update = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const reset = () => {
    setQuery("");
    setStyle("Semua gaya");
    setPrice(priceRanges[0].label);
    setLand(landRanges[0].label);
    setBuilding(buildingRanges[0].label);
    setBedrooms("Semua kamar");
    setSort("Rekomendasi");
    setPage(1);
  };
  const filters = (
    <div className="space-y-5">
      <CustomSelect
        id="filter-style"
        label="Gaya arsitektur"
        open={openSelect === "filter-style"}
        onOpenChange={(open) => setSelectOpen("filter-style", open)}
        value={style}
        options={styles}
        onChange={(value) => update(setStyle, value)}
      />
      <CustomSelect
        id="filter-price"
        label="Estimasi biaya"
        open={openSelect === "filter-price"}
        onOpenChange={(open) => setSelectOpen("filter-price", open)}
        value={price}
        options={priceRanges.map((item) => item.label)}
        onChange={(value) => update(setPrice, value)}
      />
      <CustomSelect
        id="filter-land"
        label="Luas tanah"
        open={openSelect === "filter-land"}
        onOpenChange={(open) => setSelectOpen("filter-land", open)}
        value={land}
        options={landRanges.map((item) => item.label)}
        onChange={(value) => update(setLand, value)}
      />
      <CustomSelect
        id="filter-building"
        label="Luas bangunan"
        open={openSelect === "filter-building"}
        onOpenChange={(open) => setSelectOpen("filter-building", open)}
        value={building}
        options={buildingRanges.map((item) => item.label)}
        onChange={(value) => update(setBuilding, value)}
      />
      <CustomSelect
        id="filter-bedrooms"
        label="Jumlah kamar"
        open={openSelect === "filter-bedrooms"}
        onOpenChange={(open) => setSelectOpen("filter-bedrooms", open)}
        value={bedrooms}
        options={["Semua kamar", "2 kamar", "3 kamar", "4 kamar atau lebih"]}
        onChange={(value) => update(setBedrooms, value)}
      />
      <button
        type="button"
        onClick={reset}
        className="w-full cursor-pointer rounded-full border border-[#dbe4f2] px-4 py-2.5 text-sm font-bold text-[#045ec2] transition hover:border-[#8fb9ed] hover:bg-[#eef5ff]"
      >
        Reset filter
      </button>
    </div>
  );
  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 text-[#111e3f]">
      <section className="relative isolate overflow-visible bg-[#111e3f] text-white">
        <div className="absolute inset-0 -z-20 bg-[url('/images/aset/construction.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 -z-10 bg-[#111e3f]/75" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08152f]/95 via-[#111e3f]/75 to-[#111e3f]/35" />

        <div className="mx-auto flex min-h-[520px] max-w-screen-2xl flex-col justify-end px-6 pb-16 pt-32 lg:px-8 lg:pb-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold tracking-wide text-[#b9d8ff]">
              Katalog Way2Home
            </p>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-[-0.04em] md:text-6xl">
              Temukan rumah yang terasa seperti rumah.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 md:text-lg">
              Jelajahi koleksi desain rumah dengan spesifikasi dasar, estimasi
              biaya, dan durasi pembangunan yang mudah dipahami.
            </p>
          </div>

          {/* Search + sort: di tengah, di dalam container */}
          <div className="mx-auto mt-10 flex w-full max-w-screen-2xl flex-col gap-3 rounded-2xl border border-white/60 bg-white p-3 shadow-[0_20px_45px_rgba(17,30,63,0.2)] sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="catalog-search">
              Cari desain rumah
            </label>
            <input
              id="catalog-search"
              value={query}
              onChange={(event) => update(setQuery, event.target.value)}
              placeholder="Cari nama, gaya, atau lokasi..."
              className="h-12 min-w-0 flex-1 rounded-xl bg-[#f7f9fc] px-4 text-sm text-[#111e3f] outline-none transition focus:ring-2 focus:ring-[#045ec2]/25"
            />
            <div className="w-full shrink-0 sm:w-56 [&_button]:h-12 [&_button]:min-h-12 [&_button]:w-full [&_button]:rounded-xl">
              <CustomSelect
                id="catalog-sort"
                label=""
                open={openSelect === "catalog-sort"}
                onOpenChange={(open) => setSelectOpen("catalog-sort", open)}
                value={sort}
                options={["Rekomendasi", "Harga terendah", "Harga tertinggi"]}
                onChange={(value) => update(setSort, value)}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-screen-2xl px-6 pt-20 lg:px-8">
        <div className="mb-8 lg:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="min-h-11 w-full cursor-pointer rounded-full bg-[#004796] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Filter desain
          </button>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="hidden rounded-2xl border border-[#dbe4f2] bg-white p-5 shadow-sm lg:block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold">Filter desain</h2>
              <span className="text-xs text-[#64748b]">
                {filtered.length} hasil
              </span>
            </div>
            {filters}
          </aside>
          <div>
            <p className="mb-5 text-sm text-[#64748b]">
              Menampilkan{" "}
              <strong className="text-[#111e3f]">{filtered.length}</strong>{" "}
              desain rumah
            </p>
            {filtered.length ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visible.map((design) => (
                    <DesignCard key={design.slug} design={design} />
                  ))}
                </div>
                {pageCount > 1 && (
                  <nav
                    aria-label="Pagination katalog"
                    className="mt-10 flex flex-wrap items-center justify-center gap-2"
                  >
                    <button
                      type="button"
                      aria-label="Halaman sebelumnya"
                      disabled={currentPage === 1}
                      onClick={() => setPage((value) => value - 1)}
                      className="cursor-pointer rounded-full border border-[#dbe4f2] px-4 py-2 text-lg text-[#475569] transition hover:border-[#8fb9ed] hover:bg-[#eef5ff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <img
                        src="/images/icon/chevron-left.png"
                        alt=""
                        className="h-6 w-6"
                      />
                    </button>
                    {Array.from(
                      { length: pageCount },
                      (_, index) => index + 1,
                    ).map((item) => (
                      <button
                        type="button"
                        key={item}
                        aria-current={item === currentPage ? "page" : undefined}
                        onClick={() => setPage(item)}
                        className={`h-10 w-10 cursor-pointer rounded-full text-sm font-bold transition hover:-translate-y-0.5 ${item === currentPage ? "bg-[#004796] text-white shadow-lg" : "border border-[#dbe4f2] text-[#475569] hover:bg-[#eef5ff]"}`}
                      >
                        {item}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Halaman berikutnya"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage((value) => value + 1)}
                      className="cursor-pointer rounded-full border border-[#dbe4f2] px-4 py-2 text-lg text-[#475569] transition hover:border-[#8fb9ed] hover:bg-[#eef5ff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <img
                        src="/images/icon/chevron-right.png"
                        alt=""
                        className="h-6 w-6"
                      />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#b8c7dc] bg-white px-6 py-16 text-center">
                <h2 className="text-xl font-bold text-[#111e3f]">
                  Rumah yang Anda cari belum tersedia
                </h2>
                <p className="mt-2 text-[#64748b]">
                  Coba ubah kata kunci atau pilihan filter untuk melihat desain
                  rumah lainnya.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 cursor-pointer rounded-full bg-[#004796] px-5 py-3 text-sm font-bold text-white transition hover:shadow-lg"
                >
                  Reset pencarian dan filter
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {filterOpen && (
        <div
          className="fixed inset-0 z-[70] bg-[#111e3f]/45 p-4 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
        >
          <div className="mx-auto mt-16 max-h-[calc(100vh-5rem)] max-w-md overflow-y-auto rounded-3xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="mobile-filter-title" className="text-lg font-bold">
                Filter desain
              </h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label="Tutup filter"
                className="cursor-pointer rounded-full bg-[#f1f5f9] px-3 py-1"
              >
                ×
              </button>
            </div>
            {filters}
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="mt-5 w-full cursor-pointer rounded-full bg-[#004796] py-3 font-bold text-white transition hover:shadow-lg"
            >
              Terapkan filter
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
