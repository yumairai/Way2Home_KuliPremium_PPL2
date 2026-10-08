import Link from "next/link";
import type { Project } from "@/types/proyek";

const STATUS_STYLE: Record<string, string> = {
  "Proyek Aktif": "bg-[#ecfdf5] text-[#065f46]",
  "Pembayaran DP": "bg-[#eef5ff] text-[#004796]",
  "Kontrak Proyek": "bg-[#eef5ff] text-[#004796]",
  "Alokasi Tim": "bg-[#eef5ff] text-[#004796]",
  "Menunggu Verifikasi": "bg-[#fffaf0] text-[#92400e]",
  "Revisi Dokumen": "bg-[#fffaf0] text-[#92400e]",
  Selesai: "bg-[#f1f5f9] text-[#475569]",
  Dibatalkan: "bg-[#fef2f2] text-[#991b1b]",
};

export default function ProjectSidebar({
  projects,
  currentId,
}: {
  projects: Project[];
  currentId: number;
}) {
  return (
    <aside className="w-full shrink-0 xl:w-80">
      <div className="rounded-[1.5rem] border border-[#dbe4f2] bg-white p-6 shadow-[0_12px_30px_rgba(17,30,63,0.06)] xl:sticky xl:top-28">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#475569]">List Proyek</h2>
        <div className="mt-4 flex flex-col gap-2">
          {projects.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#64748b]">Tidak ada proyek</p>
          ) : (
            projects.map((item) => {
              const isActive = item.id === currentId;
              return (
                <Link
                  key={item.id}
                  href={`/proyek/${item.id}`}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    isActive
                      ? "bg-[#eef5ff] font-bold text-[#004796]"
                      : "text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 21V9l9-6 9 6v12" />
                    <path d="M9 21v-6h6v6" />
                  </svg>
                  <span className="flex-1 truncate text-sm">{item.designName}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[item.status] ?? "bg-[#f1f5f9] text-[#475569]"}`}>
                    {item.status}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
