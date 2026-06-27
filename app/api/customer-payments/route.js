import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Missing login token." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user?.email) {
    return Response.json({ error: "Invalid login token." }, { status: 401 });
  }

  const email = userData.user.email.toLowerCase();

  const { data: payments, error } = await supabase
    .from("payments")
    .select("id, amount_total, currency, payment_status, description, receipt_url, created_at")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ payments });
}
