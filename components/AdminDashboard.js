'use client';
 
import { Fragment, useMemo, useState } from 'react';
import { copy } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';
 
function money(value, currency = 'usd') {
  return `$${Number(value || 0).toFixed(2)} ${String(currency || 'usd').toUpperCase()}`;
}
 
function formatPaymentDate(date) {
  if (!date) return '—';
 
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
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
  const card =
    payment.payment_method_brand || payment.payment_method_last4
      ? ` (${[
          payment.payment_method_brand,
          payment.payment_method_last4 ? `•••• ${payment.payment_method_last4}` : '',
        ]
          .filter(Boolean)
          .join(' ')})`
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
  const [weights, setWeights] = useState({});
  const [shippoRates, setShippoRates] = useState({});
  const [shippoStatus, setShippoStatus] = useState('');
  const t = copy[lang];
 
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
 
    return payments.filter((payment) => {
      const haystack = JSON.stringify(payment).toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesStatus =
        status === 'all' || payment.payment_status === status || payment.refund_status === status;
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
  const latest = payments[0]?.created_at ? formatPaymentDate(payments[0].created_at) : '—';
 
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
      'created_at',
      'customer_name',
      'customer_email',
      'customer_phone',
      'amount_total',
      'currency',
      'payment_status',
      'refund_status',
      'payment_method',
      'payment_method_brand',
      'payment_method_last4',
      'billing_address',
      'shipping_address',
      'description',
      'receipt_url',
      'stripe_session_id',
      'stripe_payment_intent',
      'stripe_customer_id',
      'payment_link',
      'admin_notes',
    ];
 
    const rows = [
      headers.join(','),
      ...filtered.map((p) =>
        headers
          .map((h) => {
            const value = h.includes('address') ? formatAddress(p[h]) : p[h];
            return `"${String(value ?? '').replaceAll('"', '""')}"`;
          })
          .join(',')
      ),
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

  async function getShippingRates(payment) {
    setShippoStatus('Getting shipping rates...');

    const weight = weights[payment.id];

    if (!weight || Number(weight) <= 0) {
      setShippoStatus('Enter a package weight first.');
      setTimeout(() => setShippoStatus(''), 2500);
      return;
    }

    const res = await fetch('/api/admin/shippo-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.id,
        shippingAddress: payment.shipping_address,
        customerName: payment.customer_name,
        customerEmail: payment.customer_email,
        customerPhone: payment.customer_phone,
        weight,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setShippoStatus(data.error || 'Could not get shipping rates.');
      setTimeout(() => setShippoStatus(''), 4000);
      return;
    }

    setShippoRates({
      ...shippoRates,
      [payment.id]: data.rates || [],
    });

    setShippoStatus('Shipping rates loaded.');
    setTimeout(() => setShippoStatus(''), 2500);
  }

  async function buyShippingLabel(payment, rateId) {
    setShippoStatus('Buying shipping label...');

    const res = await fetch('/api/admin/shippo-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.id,
        rateId,
        packageWeight: weights[payment.id],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setShippoStatus(data.error || 'Could not buy shipping label.');
      setTimeout(() => setShippoStatus(''), 4000);
      return;
    }

    setShippoStatus('Shipping label created. Refresh the page to see it saved.');
    setTimeout(() => setShippoStatus(''), 4000);

    if (data.labelUrl) {
      window.open(data.labelUrl, '_blank');
    }
  }
 
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }
 
  return (
    <main className="page adminPage">
      <span className="flower one no-print">✿</span>
      <span className="flower two no-print">❀</span>
      <div className="shell split adminShell">
        <aside className="card sidebar no-print">
          <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
          <h2>Admin Studio</h2>
          <p>{admin?.email}</p>
          <p><span className="pill rolePill">{admin?.role}</span></p>
          <div className="side-links">
            <a className="button secondary" href="/admin">{t.dashboard}</a>
            <button className="button ghost" onClick={logout}>{t.logout}</button>
          </div>
        </aside>
 
        <section className="adminContent">
          <div className="adminHero no-print">
            <div>
              <p className="eyebrow">Erendira&apos;s Boutique Billing</p>
              <h1>{t.paymentsDashboard}</h1>
              <p>Review every Stripe payment, customer detail, receipt, shipping address, and private admin note in one polished dashboard.</p>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
 
          <div className="statsGrid print-keep">
            <div className="stat highlight"><span>Filtered Revenue</span><b>{money(total)}</b></div>
            <div className="stat"><span>All-Time Revenue</span><b>{money(allTimeTotal)}</b></div>
            <div className="stat"><span>Paid Orders</span><b>{paid}</b></div>
            <div className="stat"><span>Customers</span><b>{customers}</b></div>
            <div className="stat"><span>Total Payments</span><b>{payments.length}</b></div>
            <div className="stat"><span>Latest Payment</span><b>{latest}</b></div>
          </div>
 
          <div className="card dashboardCard">
            <div className="filters no-print">
              <input className="input" placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="none">No refund</option>
                <option value="refunded">Refunded</option>
              </select>
              <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              <button className="button secondary" onClick={exportCsv}>{t.export}</button>
              <button className="button ghost" onClick={() => window.print()}>🖨 Print</button>
            </div>

            {noteStatus && <div className="notice no-print">{noteStatus}</div>}
            {shippoStatus && <div className="notice no-print">{shippoStatus}</div>}
 
            <div className="paymentList adminPaymentList">
              {filtered.map((p) => (
                <Fragment key={p.id || p.stripe_session_id}>
                  <article className="paymentCard adminPaymentCard">
                    <div className="paymentHeader">
                      <div>
                        <p className="eyebrow">{formatPaymentDate(p.created_at)}</p>
                        <h3>{p.customer_name || 'Customer'}</h3>
                        <p>{p.customer_email || '—'} {p.customer_phone ? `• ${p.customer_phone}` : ''}</p>
                      </div>
                      <div className="amountBlock">
                        <b>{money(p.amount_total, p.currency)}</b>
                        <span className="pill">{p.payment_status || '—'}</span>
                      </div>
                    </div>
 
                    <div className="quickDetails">
                      <div><b>Payment Method</b><p>{paymentMethodLabel(p)}</p></div>
                      <div><b>Refund</b><p>{p.refund_status || 'none'}</p></div>
                      <div><b>Lifetime Spend</b><p>{money(customerTotals.get(p.customer_email || 'unknown') || 0, p.currency)}</p></div>
                      <div><b>Receipt</b><p>{p.receipt_url ? <a href={p.receipt_url} target="_blank">Open Receipt</a> : '—'}</p></div>
                    </div>
 
                    <div className="cardActions no-print">
                      <button className="button ghost mini" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                        {expandedId === p.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                  </article>
 
                  {expandedId === p.id && (
                    <article className="paymentCard expandedCard no-print">
                      <div className="detailsGrid premiumDetailsGrid">
                        <div className="detailCard">
                          <span className="detailLabel">📦 Shipping Address</span>
                          <p>{formatAddress(p.shipping_address)}</p>
                        </div>
 
                        <div className="detailCard">
                          <span className="detailLabel">🏷 Shipping Label</span>

                          {p.label_url ? (
                            <p>
                              <a href={p.label_url} target="_blank" rel="noopener noreferrer">
                                Print Label
                              </a>
                              <br />
                              Tracking: {p.tracking_number || '—'}
                              <br />
                              {p.tracking_url && (
                                <a href={p.tracking_url} target="_blank" rel="noopener noreferrer">
                                  Track Package
                                </a>
                              )}
                            </p>
                          ) : (
                            <>
                              <p className="mutedText">Package size: 13 × 10 × 10 in</p>

                              <input
                                className="input"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Weight in lbs"
                                value={weights[p.id] || ''}
                                onChange={(e) =>
                                  setWeights({
                                    ...weights,
                                    [p.id]: e.target.value,
                                  })
                                }
                              />

                              <button
                                className="button secondary mini"
                                onClick={() => getShippingRates(p)}
                              >
                                Get Rates
                              </button>

                              {shippoRates[p.id]?.length > 0 && (
                                <div className="rateList">
                                  {shippoRates[p.id].map((rate) => (
                                    <div className="rateCard" key={rate.object_id}>
                                      <p>
                                        <b>{rate.provider}</b>
                                        <br />
                                        {rate.servicelevel?.name || rate.servicelevel_name || 'Shipping Service'}
                                        <br />
                                        ${rate.amount} {rate.currency}
                                        <br />
                                        Estimated: {rate.estimated_days || '—'} days
                                      </p>

                                      <button
                                        className="button ghost mini"
                                        onClick={() => buyShippingLabel(p, rate.object_id)}
                                      >
                                        Buy Label
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
 
                        <div className="detailCard">
                          <span className="detailLabel">🛍 Order Description</span>
                          <p>{p.description || 'No description available.'}</p>
                        </div>
 
                        <div className="detailCard">
                          <span className="detailLabel">💳 Payment Details</span>
                          <p>{paymentMethodLabel(p)}</p>
                          <p className="mutedText">Refund: {p.refund_status || 'none'}</p>
                        </div>
 
                        <div className="detailCard">
                          <span className="detailLabel">🔗 Open in Stripe</span>
                          <div className="stripeButtons">
                            {p.stripe_customer_id && (
                              <a className="miniButton" target="_blank" rel="noopener noreferrer" href={stripeUrl('customer', p.stripe_customer_id)}>
                                Customer
                              </a>
                            )}
                            {p.stripe_payment_intent && (
                              <a className="miniButton" target="_blank" rel="noopener noreferrer" href={stripeUrl('payment', p.stripe_payment_intent)}>
                                Payment
                              </a>
                            )}
                            {p.payment_link && (
                              <a className="miniButton" target="_blank" rel="noopener noreferrer" href={stripeUrl('link', p.payment_link)}>
                                Payment Link
                              </a>
                            )}
                            {p.receipt_url && (
                              <a className="miniButton" target="_blank" rel="noopener noreferrer" href={p.receipt_url}>
                                Receipt
                              </a>
                            )}
                          </div>
                        </div>
 
                        <div className="notesCard">
                          <span className="detailLabel">📝 Private Admin Notes</span>
                          <textarea
                            className="input notesArea"
                            rows="5"
                            value={notes[p.id] ?? p.admin_notes ?? ''}
                            onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                            placeholder="Write anything about this customer here..."
                          />
                          <button className="button secondary" onClick={() => saveNote(p.id)}>
                            💾 Save Notes
                          </button>
                        </div>
                      </div>
                    </article>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && <div className="emptyState">No payments match these filters.</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
