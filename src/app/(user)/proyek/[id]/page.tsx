import { createClient } from "@/utils/supabase/server";
import {
  getUserProjects,
  getUserProjectById,
} from "@/services/project.service";
import ProjectDetail from "@/components/proyek/ProjectDetail";
import MilestoneSidebar from "@/components/proyek/MilestoneSidebar";
import ProjectSidebar from "@/components/proyek/ProjectSidebar";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Proyek Rumah Saya | Way2Home",
  description: "Kelola dan pantau progres pembangunan hunian impian Anda.",
};

export default async function ProyekDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const projects = await getUserProjects(supabase);
  const project = await getUserProjectById(supabase, id);

  if (!project) notFound();

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 pt-32 text-[#111e3f]">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-8">
        <header className="mb-10">
          <LinkBack />
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
            Proyek Saya
          </h1>
          <p className="mt-2 text-base leading-7 text-[#64748b]">
            Kelola dan pantau progres pembangunan hunian impian Anda.
          </p>
        </header>

        <div className="flex flex-col gap-8 xl:flex-row">
          <ProjectSidebar projects={projects} currentId={project.id} />
          <div className="min-w-0 flex-1">
            <ProjectDetail project={project} />
          </div>
          <div className="w-full shrink-0 xl:w-[22rem]">
            <MilestoneSidebar project={project} />
          </div>
        </div>
      </div>
    </main>
  );
}

function LinkBack() {
  return (
    <Link
      href="/proyek"
      className="inline-flex text-sm font-semibold text-[#045ec2] transition hover:translate-x-1"
    >
      {"< "} Kembali ke daftar proyek
    </Link>
  );
}
