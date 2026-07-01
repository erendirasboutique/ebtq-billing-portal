import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ADMINS = [
  'hello@shoperendirasboutique.com',
];

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=missing_code&next=${encodeURIComponent(next)}`, url.origin)
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user?.email) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=session_exchange_failed&details=${encodeURIComponent(error?.message || 'no session')}`, url.origin)
    );
  }

  const email = data.user.email.toLowerCase();

  if (next.startsWith('/admin')) {
    if (!ALLOWED_ADMINS.includes(email)) {
      return NextResponse.redirect(
        new URL(`/admin/login?error=unauthorized&email=${encodeURIComponent(email)}`, url.origin)
      );
    }

    const adminSupabase = getSupabaseAdmin();

    const { error: upsertError } = await adminSupabase.from('admins').upsert(
      {
        id: data.user.id,
        email,
        role: 'owner',
        language: 'en',
        active: true,
      },
      { onConflict: 'email' }
    );

    if (upsertError) {
      return NextResponse.redirect(
        new URL(`/admin/login?error=admin_upsert_failed&details=${encodeURIComponent(upsertError.message)}`, url.origin)
      );
    }
  }

  const res = NextResponse.redirect(new URL(next, url.origin));

  res.cookies.set(next.startsWith('/admin') ? 'eb_admin_access_token' : 'sb-access-token', data.session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: data.session.expires_in || 3600,
  });

  return res;
}
