import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const { email, password } = await req.json();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!process.env.SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json({ error: "Supabase login environment variables are missing." }, { status: 500 });
  }

  const authClient = createClient(
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const { data: loginData, error: loginError } = await authClient.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (loginError || !loginData?.session?.access_token || !loginData?.user?.email) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: adminUser, error: adminError } = await supabase
    .from("admins")
    .select("email, role, active")
    .eq("email", cleanEmail)
    .eq("active", true)
    .maybeSingle();

  if (adminError || !adminUser) {
    return Response.json({ error: "This account is not authorized as an admin." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("eb_admin_access_token", loginData.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookieStore.set("eb_admin_email", cleanEmail, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return Response.json({ ok: true, role: adminUser.role });
}
