import { notFound } from "next/navigation";
import BuildHouseForm from "@/components/build/BuildHouseForm";
import { createClient } from "@/utils/supabase/server";
import { getDesignBySlug } from "@/services/design.service";

export const metadata = {
  title: "Form Pembangunan Rumah | Way2Home",
  description:
    "Lengkapi detail proyek Anda untuk memulai proses pembangunan profesional bersama Way2Home.",
};

export default async function BuildHousePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const design = await getDesignBySlug(supabase, slug);

  if (!design) notFound();

  return <BuildHouseForm design={design} />;
}
