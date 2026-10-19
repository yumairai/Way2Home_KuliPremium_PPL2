import ProfileEdit from "@/components/profile/ProfileEdit";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Edit Profile | Way2Home",
  description: "Perbarui informasi personal dan preferensi akun Way2Home Anda.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, address, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  let avatarUrl: string | null = null;
  if (profile?.avatar_url) {
    const { data } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600);
    avatarUrl = data?.signedUrl || null;
  }

  return (
    <ProfileEdit
      initialProfile={{
        userId: user.id,
        name:
          profile?.full_name ||
          String(user.user_metadata?.full_name || user.user_metadata?.name || ""),
        phone: profile?.phone || String(user.user_metadata?.phone || ""),
        email: user.email || "",
        address: profile?.address || "",
        avatarPath: profile?.avatar_url || null,
        avatarUrl,
      }}
    />
  );
}
