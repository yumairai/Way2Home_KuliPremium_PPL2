import LiveMandorProjectDetail from "@/components/mandor/LiveMandorProjectDetail";

export const metadata = {
  title: "Detail Pekerjaan | Way2Home",
  description: "Rincian pekerjaan dan laporan lapangan mandor.",
};

export default async function MandorProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveMandorProjectDetail id={id} />;
}
