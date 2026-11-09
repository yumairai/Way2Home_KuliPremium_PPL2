import { notFound } from "next/navigation";
import CustomerTracking from "@/components/proyek/tracking/CustomerTracking";
import { createClient } from "@/utils/supabase/server";
import { getUserProjectById } from "@/services/project.service";
import { getCustomerProjectTracking } from "@/services/progress.service";

export const metadata = {
  title: "Tracking Pembangunan | Way2Home",
  description:
    "Pantau tahapan, catatan tim, dan dokumentasi pembangunan rumah Anda.",
};

export default async function ProjectTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const project = await getUserProjectById(supabase, id);

  if (
    !project ||
    (project.status !== "Proyek Aktif" && project.status !== "Selesai")
  ) {
    notFound();
  }

  const tracking = await getCustomerProjectTracking(supabase, id);
  return <CustomerTracking project={{ ...project, tracking }} />;
}
