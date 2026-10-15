import PengawasShell from "@/components/pengawas/PengawasShell";
export default function PengawasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PengawasShell>{children}</PengawasShell>;
}
