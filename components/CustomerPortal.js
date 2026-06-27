'use client';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { copy } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';

export default function CustomerPortal() {
  const [lang, setLang] = useState('en');
  const t = copy[lang];
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    async function loadPayments() {
      if (!session?.access_token) return;
      setLoading(true);
      const res = await fetch('/api/customer-payments', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (res.ok) setPayments(json.payments || []);
      else setError(json.error || 'Could not load payments.');
      setLoading(false);
    }
    loadPayments();
  }, [session]);

  async function sendMagicLink(e) {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/customer` },
    });
    setLoading(false);
    if (otpError) setError(otpError.message);
    else setMessage(t.sent);
  }

  async function logout() {
    await supabase.auth.signOut();
    setPayments([]);
  }

  return <main className="page"><span className="flower one">✿</span><span className="flower two">❀</span><div className="shell">
    <div className="topbar"><div className="brand"><img src="/logo.png" className="logo" alt="Erendira's Boutique"/><div><div className="brand-title">Erendira&apos;s Boutique</div><p>{t.portal}</p></div></div><LanguageToggle lang={lang} setLang={setLang}/></div>
    {!session ? <section className="hero"><div className="card"><h1>{t.portal}</h1><p>{t.customerSub}</p><form onSubmit={sendMagicLink}><label className="field">{t.email}<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@email.com"/></label><button className="button" disabled={loading}>{loading?'...':t.sendLink}</button></form>{message&&<div className="notice">{message}</div>}{error&&<div className="notice error">{error}</div>}</div><div className="card"><img src="/logo.png" alt="logo" style={{width:'100%',maxHeight:360,objectFit:'contain'}}/></div></section> : <section className="card"><div className="topbar"><div><h1>{t.payments}</h1><p>{session.user.email}</p></div><button className="button ghost" onClick={logout}>{t.logout}</button></div>{loading&&<p>Loading...</p>}{error&&<div className="notice error">{error}</div>}{!loading && payments.length===0&&<p>{t.noPayments}</p>}{payments.length>0&&<div className="tablewrap"><table><thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Description</th><th>Receipt</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td>{new Date(p.created_at).toLocaleString()}</td><td>${Number(p.amount_total||0).toFixed(2)} {p.currency?.toUpperCase()}</td><td><span className="pill">{p.payment_status}</span></td><td>{p.description||'—'}</td><td>{p.receipt_url?<a className="button ghost" href={p.receipt_url} target="_blank">Receipt</a>:'—'}</td></tr>)}</tbody></table></div>}</section>}
    <div className="footer">© Erendira&apos;s Boutique</div>
  </div></main>;
}
