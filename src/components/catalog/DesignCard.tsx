import Image from "next/image";
import Link from "next/link";
import type { HouseDesign } from "@/types/house-design";

const formatCost = (value: number) =>
  `Rp ${(value / 1000000).toLocaleString("id-ID")} jt`;

export default function DesignCard({ design }: { design: HouseDesign }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-[#dbe4f2] bg-white shadow-[0_12px_30px_rgba(17,30,63,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(17,30,63,0.13)]">
      <Link
        href={`/katalog/${design.slug}`}
        className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-[#045ec2]/25"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e8f4fe]">
          <Image
            src={design.image}
            alt={`Desain rumah ${design.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#004796] backdrop-blur">
            {design.style}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#111e3f]">
                {design.name}
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">{design.location}</p>
            </div>
            <span className="rounded-full bg-[#eef5ff] px-2.5 py-1 text-xs font-semibold text-[#045ec2]">
              {design.floors} lantai
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-y border-[#edf1f6] py-4 text-sm text-[#475569]">
            <span>
              <strong className="block text-[#111e3f]">
                {design.buildingArea} m²
              </strong>
              Bangunan
            </span>
            <span>
              <strong className="block text-[#111e3f]">
                {design.landArea} m²
              </strong>
              Tanah
            </span>
            <span>
              <strong className="block text-[#111e3f]">
                {design.bedrooms}
              </strong>
              Kamar
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-[#64748b]">Mulai dari</p>
              <p className="font-bold text-[#004796]">
                {formatCost(design.estimatedCost)}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#64748b]">
              {design.estimatedDuration} bulan
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
