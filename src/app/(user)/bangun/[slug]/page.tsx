import BuildHouseForm from "@/components/build/BuildHouseForm";
import { getHouseDesign, houseDesigns } from "@/data/house-designs";
import { notFound } from "next/navigation";

export const metadata = { title: "Form Pembangunan Rumah | Way2Home", description: "Lengkapi detail proyek Anda untuk memulai proses pembangunan profesional bersama Way2Home." };

export function generateStaticParams() {
  return houseDesigns.map(({ slug }) => ({ slug }));
}

export default async function BuildHousePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const design = getHouseDesign(slug);
  if (!design) notFound();

  return <BuildHouseForm design={design} packageLabel="Material + Jasa" designId={design.slug} />;
}
