import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(
      new URL(next.startsWith('/admin') ? '/admin/login' : '/', url.origin)
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user?.email) {
    return NextResponse.redirect(
      new URL(next.startsWith('/admin') ? '/admin/login' : '/', url.origin)
    );
  }

  const userEmail = data.user.email.toLowerCase();

  if (next.startsWith('/admin')) {
    const allowedAdmins = [
      'hello@shoperendirasboutique.com',
    ];

    if (!allowedAdmins.includes(userEmail)) {
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized', url.origin));
    }

    const adminSupabase = getSupabaseAdmin();

    await adminSupabase.from('admins').upsert({
      id: data.user.id,
      email: userEmail,
      role: 'owner',
      language: 'en',
      active: true,
    }, {
      onConflict: 'email',
    });
  }

  const res = NextResponse.redirect(new URL(next, url.origin));

  res.cookies.set(
    next.startsWith('/admin') ? 'eb_admin_access_token' : 'sb-access-token',
    data.session.access_token,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: data.session.expires_in || 3600,
    }
  );

  return res;
}
