import type { Metadata } from "next";
import PengawasDashboard from "@/components/pengawas/PengawasDashboard";

export const metadata: Metadata = {
  title: "Dashboard Pengawas | Way2Home",
  description: "Pantau proyek pembangunan yang ditugaskan kepada Anda.",
};

export default function PengawasPage() {
  return <PengawasDashboard />;
}
