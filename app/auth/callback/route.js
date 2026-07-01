import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(new URL(next.startsWith('/admin') ? '/admin/login' : '/', url.origin));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL(next.startsWith('/admin') ? '/admin/login' : '/', url.origin));
  }

  const res = NextResponse.redirect(new URL(next, url.origin));

  const cookieName = next.startsWith('/admin')
    ? 'eb_admin_access_token'
    : 'sb-access-token';

  res.cookies.set(cookieName, data.session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: data.session.expires_in || 3600,
  });

  return res;
}
