import type { Metadata } from "next";
import LiveSupervisorProjectDetail from "@/components/pengawas/LiveSupervisorProjectDetail";
export const metadata: Metadata = {
  title: "Detail Proyek | Pengawas Way2Home",
  description: "Tinjau progres, laporan, jadwal, dan aktivitas proyek.",
};
export default async function PengawasProjectPage({
  params,
}: PageProps<"/pengawas/proyek/[id]">) {
  const { id } = await params;
  return <LiveSupervisorProjectDetail id={id} />;
}
