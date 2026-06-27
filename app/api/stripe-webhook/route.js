import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing Stripe environment variables." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionFromEvent = event.data.object;

    let session = sessionFromEvent;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionFromEvent.id, {
        expand: ["payment_intent.latest_charge", "line_items"],
      });
    } catch (_) {
      session = sessionFromEvent;
    }

    const latestCharge = session.payment_intent?.latest_charge;
    const receiptUrl = typeof latestCharge === "object" ? latestCharge?.receipt_url : null;
    const firstLineItem = session.line_items?.data?.[0];

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("payments").upsert({
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null,
      customer_name: session.customer_details?.name || session.customer_name || "",
      customer_email: (session.customer_details?.email || session.customer_email || "").toLowerCase(),
      amount_total: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || "usd",
      payment_status: session.payment_status || "paid",
      payment_link: session.payment_link || "",
      description:
        session.metadata?.description ||
        session.metadata?.order_description ||
        firstLineItem?.description ||
        "Stripe Payment",
      receipt_url: receiptUrl || "",
      raw_event: event,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return new Response("Success", { status: 200 });
}
