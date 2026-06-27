import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("eb_admin_access_token");
  cookieStore.delete("eb_admin_email");
  redirect("/admin/login");
}
