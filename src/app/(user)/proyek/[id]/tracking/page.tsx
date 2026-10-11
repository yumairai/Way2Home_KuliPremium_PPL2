import { notFound } from "next/navigation";
import { projects } from "@/data/proyek";
import CustomerTracking from "@/components/proyek/tracking/CustomerTracking";

export const metadata = {
  title: "Tracking Pembangunan | Way2Home",
  description: "Pantau tahapan, catatan tim, dan dokumentasi pembangunan rumah Anda.",
};

export function generateStaticParams() {
  return projects
    .filter((project) => project.status === "Proyek Aktif" || project.status === "Selesai")
    .map(({ id }) => ({ id: String(id) }));
}

export default async function ProjectTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.find((item) => item.id === Number(id));

  if (!project || (project.status !== "Proyek Aktif" && project.status !== "Selesai")) {
    notFound();
  }

  return <CustomerTracking project={project} />;
}
