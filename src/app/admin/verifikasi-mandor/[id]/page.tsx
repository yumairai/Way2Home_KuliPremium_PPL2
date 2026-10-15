import MandorVerificationDetail from "@/components/admin/MandorVerificationDetail";

export const metadata = {
  title: "Detail Pendaftaran Mandor | Way2Home",
  description: "Tinjau profil, pengalaman, dan CV calon mandor.",
};

export default async function MandorVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MandorVerificationDetail id={id} />;
}
