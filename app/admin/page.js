import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("eb_admin_access_token")?.value;

  if (!token) redirect("/admin/login");

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData?.user?.email) redirect("/admin/login");

  const email = userData.user.email.toLowerCase();
  const { data: adminUser } = await supabase
    .from("admins")
    .select("email, role, active")
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();

  if (!adminUser) redirect("/admin/login");

  const { data: payments = [], error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  return <AdminDashboard payments={payments || []} errorMessage={error?.message || ""} admin={adminUser} />;
}
