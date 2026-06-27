'use client';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { copy } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';

function money(value, currency = 'usd') {
  return `$${Number(value || 0).toFixed(2)} ${String(currency || 'usd').toUpperCase()}`;
}

function formatAddress(address) {
  if (!address) return '—';
  if (typeof address === 'string') return address || '—';
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean);
  return parts.length ? parts.join(' • ') : '—';
}

function paymentMethodLabel(payment) {
  if (!payment.payment_method) return '—';
  const type = payment.payment_method.replaceAll('_', ' ');
  const card = payment.payment_method_brand || payment.payment_method_last4
    ? ` (${[payment.payment_method_brand, payment.payment_method_last4 ? `•••• ${payment.payment_method_last4}` : ''].filter(Boolean).join(' ')})`
    : '';
  return `${type}${card}`;
}

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

  const total = payments.reduce((sum, payment) => sum + Number(payment.amount_total || 0), 0);

  return <main className="page"><span className="flower one">✿</span><span className="flower two">❀</span><div className="shell">
    <div className="topbar"><div className="brand"><img src="/logo.png" className="logo" alt="Erendira's Boutique"/><div><div className="brand-title">Erendira&apos;s Boutique</div><p>{t.portal}</p></div></div><LanguageToggle lang={lang} setLang={setLang}/></div>
    {!session ? <section className="hero"><div className="card"><h1>{t.portal}</h1><p>{t.customerSub}</p><form onSubmit={sendMagicLink}><label className="field">{t.email}<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@email.com"/></label><button className="button" disabled={loading}>{loading?'...':t.sendLink}</button></form>{message&&<div className="notice">{message}</div>}{error&&<div className="notice error">{error}</div>}</div><div className="card"><img src="/logo.png" alt="logo" style={{width:'100%',maxHeight:360,objectFit:'contain'}}/></div></section> : <section className="card"><div className="topbar"><div><h1>{t.payments}</h1><p>{session.user.email}</p></div><button className="button ghost" onClick={logout}>{t.logout}</button></div><div className="grid compact"><div className="stat">All-Time Total<b>${total.toFixed(2)}</b></div><div className="stat">Payments<b>{payments.length}</b></div></div>{loading&&<p>Loading...</p>}{error&&<div className="notice error">{error}</div>}{!loading && payments.length===0&&<p>{t.noPayments}</p>}{payments.length>0&&<div className="paymentCards">{payments.map(p=><article className="paymentCard" key={p.id}><div className="paymentHeader"><div><b>{money(p.amount_total, p.currency)}</b><p>{new Date(payment.created_at).toLocaleString("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
})(p.created_at).toLocaleString()}</p></div><span className="pill">{p.payment_status}</span></div><div className="detailsGrid customer"><div><b>Payment Method</b><p>{paymentMethodLabel(p)}</p></div><div><b>Shipping Address</b><p>{formatAddress(p.shipping_address)}</p></div><div><b>Billing Address</b><p>{formatAddress(p.billing_address)}</p></div><div><b>Order / Description</b><p>{p.description || '—'}</p></div><div><b>Payment ID</b><p>{p.stripe_payment_intent || p.stripe_session_id || '—'}</p></div><div><b>Receipt</b><p>{p.receipt_url?<a className="button ghost mini" href={p.receipt_url} target="_blank">Receipt</a>:'—'}</p></div></div></article>)}</div>}</section>}
    <div className="footer">© Erendira&apos;s Boutique</div>
  </div></main>;
}
