import RoleDashboard from "@/components/auth/RoleDashboard";

export const metadata = { title: "Admin | Way2Home", description: "Halaman admin Way2Home." };
export default function AdminPage() { return <RoleDashboard role="admin" />; }
