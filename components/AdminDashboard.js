'use client';
import { useMemo, useState } from 'react';
import { copy } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';

export default function AdminDashboard({ payments, admin }){
 const [lang,setLang]=useState(admin?.language || 'en'); const [q,setQ]=useState(''); const t=copy[lang];
 const filtered=useMemo(()=>payments.filter(p=>JSON.stringify(p).toLowerCase().includes(q.toLowerCase())),[payments,q]);
 const total=payments.reduce((sum,p)=>sum+Number(p.amount_total||0),0);
 const paid=payments.filter(p=>p.payment_status==='paid' || p.status==='paid').length;
 const customers=new Set(payments.map(p=>p.customer_email).filter(Boolean)).size;
 const latest=payments[0]?.created_at ? new Date(payments[0].created_at).toLocaleDateString() : '—';
 function exportCsv(){ const headers=['created_at','customer_name','customer_email','amount_total','currency','payment_status','description','receipt_url']; const rows=[headers.join(','),...filtered.map(p=>headers.map(h=>`"${String(p[h]??'').replaceAll('"','""')}"`).join(','))]; const blob=new Blob([rows.join('\n')],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='erendiras-payments.csv'; a.click(); URL.revokeObjectURL(url); }
 async function logout(){ await fetch('/api/admin/logout',{method:'POST'}); window.location.href='/admin/login'; }
 return <main className="page"><div className="shell split"><aside className="card sidebar"><img src="/logo.png" className="logo" alt="Erendira's Boutique"/><h2>Admin</h2><p>{admin?.email}</p><p><span className="pill">{admin?.role}</span></p><div className="side-links"><a className="button secondary" href="/admin">{t.dashboard}</a><button className="button ghost" onClick={logout}>{t.logout}</button></div></aside><section><div className="topbar"><div><h1>{t.paymentsDashboard}</h1><p>Erendira&apos;s Boutique</p></div><LanguageToggle lang={lang} setLang={setLang}/></div><div className="grid"><div className="stat">{t.totalRevenue}<b>${total.toFixed(2)}</b></div><div className="stat">{t.paidOrders}<b>{paid}</b></div><div className="stat">{t.customers}<b>{customers}</b></div><div className="stat">{t.latestPayment}<b>{latest}</b></div></div><div className="card" style={{marginTop:18}}><div className="searchrow"><input className="input" placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)}/><button className="button secondary" onClick={exportCsv}>{t.export}</button></div><div className="tablewrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Email</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id || p.stripe_session_id}><td>{new Date(p.created_at).toLocaleString()}</td><td>{p.customer_name || '—'}</td><td>{p.customer_email || '—'}</td><td>${Number(p.amount_total||0).toFixed(2)} {p.currency?.toUpperCase()}</td><td><span className="pill">{p.payment_status || '—'}</span></td><td>{p.receipt_url?<a href={p.receipt_url} target="_blank">Open</a>:'—'}</td></tr>)}</tbody></table></div></div></section></div></main>
}
