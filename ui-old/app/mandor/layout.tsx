import MandorShell from "@/components/mandor/MandorShell";

export default function MandorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MandorShell>{children}</MandorShell>;
}
