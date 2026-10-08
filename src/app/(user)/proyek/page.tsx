import Link from "next/link";
import { projects } from "@/data/proyek";
import ProjectSidebar from "@/components/proyek/ProjectSidebar";
import ProjectDetail from "@/components/proyek/ProjectDetail";
import MilestoneSidebar from "@/components/proyek/MilestoneSidebar";

export const metadata = {
  title: "Proyek Rumah Saya | Way2Home",
  description: "Kelola dan pantau progres pembangunan hunian impian Anda.",
};

export default function ProyekListPage() {
  const project = projects[0];

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 pt-32 text-[#111e3f]">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">Proyek Saya</h1>
            <p className="mt-2 text-base leading-7 text-[#64748b]">
              Kelola dan pantau progres pembangunan hunian impian Anda.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe4f2] bg-white px-4 py-2 text-sm font-bold text-[#475569]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            {projects.length} Proyek
          </span>
        </header>

        {project ? (
          <div className="flex flex-col gap-8 xl:flex-row">
            <ProjectSidebar projects={projects} currentId={project.id} />
            <div className="min-w-0 flex-1">
              <ProjectDetail project={project} />
            </div>
            <div className="w-full shrink-0 xl:w-[22rem]">
              <MilestoneSidebar project={project} />
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-[#dbe4f2] bg-white py-20 text-center shadow-[0_12px_30px_rgba(17,30,63,0.06)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5ff] text-[#004796]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21V9l9-6 9 6v12" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold">Anda belum memiliki proyek pembangunan rumah</h2>
            <p className="mx-auto mt-3 max-w-md text-[#64748b]">
              Silakan pergi ke halaman rekomendasi rumah dan buat proyek Anda dari sana.
            </p>
            <Link
              href="/ai-planning-based"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 py-4 font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            >
              Lihat Rekomendasi Rumah
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
