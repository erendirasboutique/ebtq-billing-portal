export function money(value, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
  }).format(Number(value || 0));
}

export function formatDate(date) {
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

export function formatAddress(address) {
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

export function paymentMethodLabel(payment) {
  if (!payment.payment_method) return '—';
  const type = String(payment.payment_method).replaceAll('_', ' ');
  const card = payment.payment_method_brand || payment.payment_method_last4
    ? ` (${[payment.payment_method_brand, payment.payment_method_last4 ? `•••• ${payment.payment_method_last4}` : ''].filter(Boolean).join(' ')})`
    : '';
  return `${type}${card}`;
}
