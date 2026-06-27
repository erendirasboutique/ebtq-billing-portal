import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function cleanAddress(address) {
  if (!address) return null;
  return {
    line1: address.line1 || '',
    line2: address.line2 || '',
    city: address.city || '',
    state: address.state || '',
    postal_code: address.postal_code || '',
    country: address.country || '',
  };
}

function getPaymentMethodDetails(paymentIntent) {
  const charge = paymentIntent?.latest_charge;
  const details = charge?.payment_method_details;
  if (!details) return { paymentMethod: '', brand: '', last4: '' };

  const type = details.type || paymentIntent?.payment_method?.type || '';
  const card = details.card || paymentIntent?.payment_method?.card || null;

  return {
    paymentMethod: type,
    brand: card?.brand || '',
    last4: card?.last4 || '',
  };
}

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY');
    return new Response('Missing Stripe secret key', { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature error:', error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    let receiptUrl = null;
    let paymentMethod = '';
    let paymentMethodBrand = '';
    let paymentMethodLast4 = '';
    let refundStatus = 'none';

    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
          expand: ['latest_charge', 'payment_method'],
        });

        receiptUrl = pi.latest_charge?.receipt_url || null;
        refundStatus = pi.latest_charge?.refunded ? 'refunded' : 'none';
        const method = getPaymentMethodDetails(pi);
        paymentMethod = method.paymentMethod;
        paymentMethodBrand = method.brand;
        paymentMethodLast4 = method.last4;
      }
    } catch (error) {
      console.error('Could not retrieve PaymentIntent details:', error.message);
    }

    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from('payments').upsert({
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
      customer_name: session.customer_details?.name || session.collected_information?.individual_name || session.shipping?.name || '',
      customer_email: email,
      customer_phone: session.customer_details?.phone || session.shipping?.phone || '',
      amount_total: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      payment_status: session.payment_status || 'paid',
      refund_status: refundStatus,
      payment_method: paymentMethod,
      payment_method_brand: paymentMethodBrand,
      payment_method_last4: paymentMethodLast4,
      billing_address: cleanAddress(session.customer_details?.address),
      shipping_address: cleanAddress(session.shipping?.address || session.collected_information?.shipping_details?.address),
      payment_link: typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id || '',
      description: session.metadata?.description || session.metadata?.order || session.metadata?.order_number || '',
      receipt_url: receiptUrl,
      raw: session,
      created_at: new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    }, { onConflict: 'stripe_session_id' });

    if (error) {
      console.error('Supabase insert error:', error.message);
      return new Response('Supabase insert failed', { status: 500 });
    }
  }

  return new Response('Success', { status: 200 });
}
