import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHouseDesign, houseDesigns } from "@/data/house-designs";

export function generateStaticParams() {
  return houseDesigns.map(({ slug }) => ({ slug }));
}
const money = (value: number) =>
  `Rp ${(value / 1000000).toLocaleString("id-ID")} juta`;

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const design = getHouseDesign(slug);
  if (!design) notFound();
  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 pt-28 text-[#111e3f]">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Link
          href="/katalog"
          className="inline-flex py-4 text-sm font-semibold text-[#045ec2] transition-transform duration-300 hover:translate-x-2 active:scale-95"
        >
          {"< "} Kembali ke katalog
        </Link>
        <div className="mt-4 grid overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(17,30,63,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[360px] lg:min-h-[620px]">
            <Image
              src={design.image}
              alt={`Desain rumah ${design.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
          <div className="p-7 md:p-10">
            <span className="text-sm font-bold text-[#045ec2]">
              {design.style}
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em]">
              {design.name}
            </h1>
            <p className="mt-4 leading-7 text-[#64748b]">
              {design.description}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Luas tanah", `${design.landArea} m²`],
                ["Luas bangunan", `${design.buildingArea} m²`],
                ["Kamar tidur", `${design.bedrooms} kamar`],
                ["Lantai", `${design.floors} lantai`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs text-[#64748b]">{label}</p>
                  <p className="mt-1 font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-[#edf1f6] pt-6">
              <p className="text-sm text-[#64748b]">Estimasi pembangunan</p>
              <p className="mt-1 text-2xl font-bold text-[#004796]">
                {money(design.estimatedCost)}
              </p>
              <p className="mt-2 text-sm text-[#64748b]">
                Durasi sekitar {design.estimatedDuration} bulan daerah {" "}
                {design.location}
              </p>
            </div>
            <Link
              href={`/bangun/${design.slug}`}
              className="mt-8 block w-full rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-6 py-4 text-center font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Mulai rencanakan rumah
            </Link>
          </div>
        </div>
        <section className="mt-10 rounded-[2rem] bg-[#111e3f] p-8 text-white md:p-10">
          <h2 className="text-2xl font-bold">Yang menonjol dari desain ini</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {design.highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/85"
              >
                {highlight}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
