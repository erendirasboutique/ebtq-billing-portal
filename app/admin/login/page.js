'use client';

import { useEffect, useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AdminLoginPage() {
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const supabase = getSupabaseBrowser();

  useEffect(() => {
    async function finishGoogleLogin() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (!code) return;

      setMessage('Finishing Google sign in...');

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data?.session?.access_token) {
        setMessage(error?.message || 'Google login failed.');
        return;
      }

      const res = await fetch('/api/auth/admin-google-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error || 'Google admin login failed.');
        return;
      }

      window.history.replaceState(null, '', '/admin/login');
      window.location.href = '/admin';
    }

    finishGoogleLogin();
  }, [supabase.auth]);

  async function login(e) {
    e.preventDefault();
    setMessage('Signing in...');

    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not sign in.');
      return;
    }

    window.location.href = '/admin';
  }

  async function signInWithGoogle() {
    setMessage('Redirecting to Google...');

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    ).replace(/\/$/, '');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/admin/login`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setMessage(error.message || 'Could not continue with Google.');
    }
  }

  return (
    <main className="page">
      <span className="flower one">✿</span>
      <span className="flower two">❀</span>

      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
            <div className="brand-title">Admin Studio</div>
          </div>

          <LanguageToggle lang={lang} setLang={setLang} />
        </div>

        <section className="hero">
          <div className="card loginCard">
            <p className="eyebrow">Secure team access</p>
            <h1>Billing admin login</h1>
            <p>
              Sign in with an approved admin account to review payments and
              customers.
            </p>

            <button className="button googleButton" type="button" onClick={signInWithGoogle}>
              Continue with Google
            </button>

            <div className="notice" style={{ marginTop: 16 }}>
              Or sign in with email and password.
            </div>

            <form onSubmit={login}>
              <label className="field">
                Email
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                Password
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <button className="button ghost" type="submit">
                Sign In
              </button>
            </form>

            {message && <div className="notice">{message}</div>}
          </div>

          <div className="card brandShowcase">
            <img src="/logo.png" alt="Erendira's Boutique" />
          </div>
        </section>
      </div>
    </main>
  );
}
