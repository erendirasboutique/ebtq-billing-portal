import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('eb_admin_access_token')?.value;
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user?.email) return null;

  const email = userData.user.email.toLowerCase();
  const { data: adminUser } = await supabase
    .from('admins')
    .select('email, role, active')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();

  return adminUser;
}

export async function POST(req) {
  const admin = await getAdmin();
  if (!admin || admin.role === 'staff') {
    return Response.json({ error: 'Not allowed.' }, { status: 403 });
  }

  const { id, admin_notes } = await req.json();
  if (!id) return Response.json({ error: 'Missing payment id.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('payments')
    .update({ admin_notes: admin_notes || '' })
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
