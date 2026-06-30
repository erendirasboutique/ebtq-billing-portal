'use client';

import { useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';

export default function AdminLoginPage() {
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function login(e) {
    e.preventDefault();
    setMessage('Signing in...');

    const res = await fetch('/api/auth/admin-login', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not sign in.');
      return;
    }

    window.location.href = '/admin';
  }

  return (
    <main className="page">
      <span className="flower one">✿</span><span className="flower two">❀</span>
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
            <p>Sign in with an approved admin account to review payments and customers.</p>
            <form onSubmit={login}>
              <label className="field">Email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
              <label className="field">Password<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
              <button className="button secondary" type="submit">Sign In</button>
            </form>
            {message && <div className="notice">{message}</div>}
          </div>
          <div className="card brandShowcase"><img src="/logo.png" alt="Erendira's Boutique" /></div>
        </section>
      </div>
    </main>
  );
}
