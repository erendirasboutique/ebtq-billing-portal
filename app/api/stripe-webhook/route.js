import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export async function POST(req){
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  let event;
  try{
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  }catch(error){ return new Response(`Webhook Error: ${error.message}`, {status:400}); }
  if(event.type === 'checkout.session.completed'){
    const session = event.data.object;
    let receiptUrl = null;
    try{
      if(session.payment_intent){
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent, { expand:['latest_charge'] });
        receiptUrl = pi.latest_charge?.receipt_url || null;
      }
    }catch(_e){}
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();
    const supabase=getSupabaseAdmin();
    await supabase.from('payments').upsert({
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      customer_name: session.customer_details?.name || '',
      customer_email: email,
      amount_total: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      payment_status: session.payment_status || 'paid',
      payment_link: session.payment_link || '',
      description: session.metadata?.description || session.metadata?.order || '',
      receipt_url: receiptUrl,
      raw: session,
      created_at: new Date((session.created || Math.floor(Date.now()/1000))*1000).toISOString()
    }, { onConflict:'stripe_session_id' });
  }
  return new Response('Success', {status:200});
}
