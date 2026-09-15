import DefaultNavbar from "@/components/navbar/DefaultNavbar";
import Footer from "@/components/footer/Footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DefaultNavbar />
      {children}
      <Footer />
    </>
  );
}
