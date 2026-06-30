'use client';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { copy } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';
import { money, formatPaymentDate, paymentMethodLabel, formatAddress } from '@/lib/format';

export default function CustomerPortal() {
  const [lang,setLang]=useState('en');
  const [email,setEmail]=useState('');
  const [session,setSession]=useState(null);
  const [payments,setPayments]=useState([]);
  const [status,setStatus]=useState('');
  const [loading,setLoading]=useState(true);
  const supabase = getSupabaseBrowser();
  const t=copy[lang];

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{ setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess)=>{ setSession(sess); });
    return ()=>sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    async function load(){
      if(!session?.access_token) return;
      setStatus('Loading payment history...');
      const res=await fetch('/api/customer-payments',{headers:{Authorization:`Bearer ${session.access_token}`}});
      const data=await res.json();
      if(!res.ok){setStatus(data.error || 'Could not load payments.');return;}
      setPayments(data.payments || []); setStatus('');
    }
    load();
  },[session?.access_token]);

  const name = payments.find(p=>p.customer_name)?.customer_name || session?.user?.email?.split('@')[0] || 'Customer';
  const total = useMemo(()=>payments.reduce((s,p)=>s+Number(p.amount_total||0),0),[payments]);
  const last = payments[0]?.created_at ? formatPaymentDate(payments[0].created_at) : '—';

  async function sendMagicLink(e){
    e.preventDefault();
    setStatus('Sending secure link...');
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback` } });
    setStatus(error ? error.message : t.checkEmail);
  }

  async function signOut(){ await supabase.auth.signOut(); setSession(null); setPayments([]); }

  if(loading) return <main className="page"><div className="shell"><div className="card">Loading...</div></div></main>;

  if(!session){
    return <main className="page"><span className="flower one">✿</span><span className="flower two">❀</span><div className="shell"><div className="topbar"><div className="brand"><img src="/logo.png" className="logo" alt="Erendira's Boutique"/><span className="brand-title">Erendira&apos;s Boutique</span></div><LanguageToggle lang={lang} setLang={setLang}/></div><section className="hero"><div className="card loginCard"><p className="eyebrow">Secure billing</p><h1>{t.customerTitle}</h1><p>{t.customerSubtitle}</p><form onSubmit={sendMagicLink}><label className="field">Email address<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label><button className="button secondary" type="submit">{t.sendLink}</button></form>{status && <div className="notice">{status}</div>}</div><div className="card brandShowcase"><img src="/logo.png" alt="Erendira's Boutique logo"/></div></section><p className="footer">Payments are matched by the email used at checkout.</p></div></main>;
  }

  return <main className="page"><span className="flower one no-print">✿</span><span className="flower two no-print">❀</span><div className="shell customerDashboard"><div className="topbar no-print"><div className="brand"><img src="/logo.png" className="logo" alt="Erendira's Boutique"/><span className="brand-title">Erendira&apos;s Boutique</span></div><div style={{display:'flex',gap:10,alignItems:'center'}}><LanguageToggle lang={lang} setLang={setLang}/><button className="button ghost mini" onClick={signOut}>{t.signOut}</button></div></div><section className="customerWelcome card"><div><p className="eyebrow">Welcome back</p><h1>{name} 🌸</h1><p>Thank you for shopping with Erendira&apos;s Boutique. Your payment history, receipts, and order details are below.</p></div><img src="/logo.png" className="logo" alt=""/></section><div className="customerSummary"><div className="stat"><span>Lifetime purchases</span><b>{money(total)}</b></div><div className="stat"><span>Total payments</span><b>{payments.length}</b></div><div className="stat"><span>Last payment</span><b>{last}</b></div></div>{status && <div className="notice">{status}</div>}<section className="paymentList">{payments.map(p=><article className="paymentCard" key={p.id || p.stripe_session_id || p.clover_payment_id}><div className="paymentHeader"><div><p className="eyebrow">{formatPaymentDate(p.created_at)}</p><h3>{money(p.amount_total,p.currency)}</h3><p>{p.description || 'Erendira’s Boutique payment'}</p></div><div className="amountBlock"><span className={`pill source-${p.payment_source || 'stripe'}`}>{p.payment_source || 'stripe'}</span><span className="pill">{p.payment_status || 'paid'}</span></div></div><div className="quickDetails"><div><b>Payment Method</b><p>{paymentMethodLabel(p)}</p></div><div><b>Shipping Address</b><p>{formatAddress(p.shipping_address)}</p></div><div><b>Receipt</b><p>{p.receipt_url?<a href={p.receipt_url} target="_blank" rel="noopener noreferrer">Open Receipt</a>:'—'}</p></div></div></article>)}{payments.length===0 && <div className="emptyState">{t.noPayments}</div>}</section></div></main>;
}
