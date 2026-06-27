'use client';
import { Fragment, useMemo, useState } from 'react';
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

function stripeUrl(kind, id) {
  if (!id) return '';
  if (kind === 'customer') return `https://dashboard.stripe.com/customers/${id}`;
  if (kind === 'payment') return `https://dashboard.stripe.com/payments/${id}`;
  if (kind === 'session') return `https://dashboard.stripe.com/payments/checkout/${id}`;
  if (kind === 'link') return `https://dashboard.stripe.com/payment-links/${id}`;
  return '';
}

export default function AdminDashboard({ payments, admin }) {
  const [lang, setLang] = useState(admin?.language || 'en');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [noteStatus, setNoteStatus] = useState('');
  const t = copy[lang];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return payments.filter((payment) => {
      const haystack = JSON.stringify(payment).toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesStatus = status === 'all' || payment.payment_status === status || payment.refund_status === status;
      const date = payment.created_at ? new Date(payment.created_at) : null;
      const afterFrom = !fromDate || (date && date >= new Date(`${fromDate}T00:00:00`));
      const beforeTo = !toDate || (date && date <= new Date(`${toDate}T23:59:59`));
      return matchesQuery && matchesStatus && afterFrom && beforeTo;
    });
  }, [payments, q, status, fromDate, toDate]);

  const total = filtered.reduce((sum, p) => sum + Number(p.amount_total || 0), 0);
  const allTimeTotal = payments.reduce((sum, p) => sum + Number(p.amount_total || 0), 0);
  const paid = filtered.filter((p) => p.payment_status === 'paid').length;
  const customers = new Set(filtered.map((p) => p.customer_email).filter(Boolean)).size;
  const latest = payments[0]?.created_at ? new Date(payments[0].created_at).toLocaleDateString() : '—';

  const customerTotals = useMemo(() => {
    const map = new Map();
    for (const payment of payments) {
      const email = payment.customer_email || 'unknown';
      map.set(email, (map.get(email) || 0) + Number(payment.amount_total || 0));
    }
    return map;
  }, [payments]);

  function exportCsv() {
    const headers = [
      'created_at', 'customer_name', 'customer_email', 'customer_phone', 'amount_total', 'currency',
      'payment_status', 'refund_status', 'payment_method', 'payment_method_brand', 'payment_method_last4',
      'billing_address', 'shipping_address', 'description', 'receipt_url', 'stripe_session_id',
      'stripe_payment_intent', 'stripe_customer_id', 'payment_link', 'admin_notes'
    ];
    const rows = [
      headers.join(','),
      ...filtered.map((p) => headers.map((h) => {
        const value = h.includes('address') ? formatAddress(p[h]) : p[h];
        return `"${String(value ?? '').replaceAll('"', '""')}"`;
      }).join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erendiras-all-time-payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveNote(paymentId) {
    setNoteStatus('Saving...');
    const res = await fetch('/api/admin/payment-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paymentId, admin_notes: notes[paymentId] || '' }),
    });
    setNoteStatus(res.ok ? 'Saved.' : 'Could not save note.');
    setTimeout(() => setNoteStatus(''), 2000);
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return <main className="page"><div className="shell split"><aside className="card sidebar"><img src="/logo.png" className="logo" alt="Erendira's Boutique"/><h2>Admin</h2><p>{admin?.email}</p><p><span className="pill">{admin?.role}</span></p><div className="side-links"><a className="button secondary" href="/admin">{t.dashboard}</a><button className="button ghost" onClick={logout}>{t.logout}</button></div></aside><section><div className="topbar"><div><h1>{t.paymentsDashboard}</h1><p>All-time billing history for Erendira&apos;s Boutique.</p></div><LanguageToggle lang={lang} setLang={setLang}/></div><div className="grid"><div className="stat">Filtered Revenue<b>${total.toFixed(2)}</b></div><div className="stat">All-Time Revenue<b>${allTimeTotal.toFixed(2)}</b></div><div className="stat">Paid Orders<b>{paid}</b></div><div className="stat">Customers<b>{customers}</b></div><div className="stat">Total Payments<b>{payments.length}</b></div><div className="stat">Latest Payment<b>{latest}</b></div></div><div className="card" style={{marginTop:18}}><div className="filters"><input className="input" placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)}/><select className="input" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="none">No refund</option><option value="refunded">Refunded</option></select><input className="input" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/><input className="input" type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/><button className="button secondary" onClick={exportCsv}>{t.export}</button></div>{noteStatus && <div className="notice">{noteStatus}</div>}<div className="tablewrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Email / Phone</th><th>Amount</th><th>Status</th><th>Payment Method</th><th>Receipt</th><th>Details</th></tr></thead><tbody>{filtered.map(p=><Fragment key={p.id || p.stripe_session_id}><tr><td>{new Date(p.created_at).toLocaleString()}</td><td>{p.customer_name || '—'}</td><td>{p.customer_email || '—'}<br/><small>{p.customer_phone || ''}</small></td><td>{money(p.amount_total, p.currency)}</td><td><span className="pill">{p.payment_status || '—'}</span><br/><small>Refund: {p.refund_status || 'none'}</small></td><td>{paymentMethodLabel(p)}</td><td>{p.receipt_url?<a href={p.receipt_url} target="_blank">Open</a>:'—'}</td><td><button className="button ghost mini" onClick={()=>setExpandedId(expandedId===p.id?null:p.id)}>{expandedId===p.id?'Hide':'View'}</button></td></tr>{expandedId===p.id && <tr><td colSpan="8"><div className="detailsGrid"><div><b>Shipping Address</b><p>{formatAddress(p.shipping_address)}</p></div><div><b>Billing Address</b><p>{formatAddress(p.billing_address)}</p></div><div><b>Customer Lifetime Total</b><p>${Number(customerTotals.get(p.customer_email || 'unknown') || 0).toFixed(2)}</p></div><div><b>Description / Order</b><p>{p.description || '—'}</p></div><div><b>Stripe IDs</b><p>Session: {p.stripe_session_id || '—'}<br/>Payment: {p.stripe_payment_intent || '—'}<br/>Customer: {p.stripe_customer_id || '—'}<br/>Payment Link: {p.payment_link || '—'}</p></div><div><b>Open in Stripe</b><p className="linkList">{p.stripe_customer_id && <a target="_blank" href={stripeUrl('customer', p.stripe_customer_id)}>Customer</a>}{p.stripe_payment_intent && <a target="_blank" href={stripeUrl('payment', p.stripe_payment_intent)}>Payment</a>}{p.stripe_session_id && <a target="_blank" href={stripeUrl('session', p.stripe_session_id)}>Checkout</a>}{p.payment_link && <a target="_blank" href={stripeUrl('link', p.payment_link)}>Payment Link</a>}</p></div><div className="notesBox"><b>Admin Notes</b><textarea className="input" rows="3" value={notes[p.id] ?? p.admin_notes ?? ''} onChange={(e)=>setNotes({...notes,[p.id]:e.target.value})} placeholder="Add private boutique notes..."/><button className="button secondary mini" onClick={()=>saveNote(p.id)}>Save Note</button></div></div></td></tr>}</Fragment>)}{filtered.length===0 && <tr><td colSpan="8">No payments match these filters.</td></tr>}</tbody></table></div></div></section></div></main>
}
