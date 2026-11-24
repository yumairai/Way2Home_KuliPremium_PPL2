import DefaultNavbar from "@/components/navbar/DefaultNavbar";
import Footer from "@/components/footer/Footer";
import { TestModeBadge } from "@/components/test/TestModeBadge";
import { TestModeProvider } from "@/context/TestModeContext";
import { createClient } from "@/utils/supabase/server";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isTestMode = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_test_user, role")
      .eq("id", user.id)
      .maybeSingle();
    isTestMode =
      profile?.role === "customer" && profile.is_test_user === true;
  }

  return (
    <TestModeProvider isTestMode={isTestMode}>
      <DefaultNavbar />
      {children}
      <Footer />
      <TestModeBadge />
    </TestModeProvider>
  );
}
