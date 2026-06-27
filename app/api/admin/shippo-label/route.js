import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const SHIPPO_API_URL = "https://api.goshippo.com";

export async function POST(req) {
  try {
    const { paymentId, rateId, packageWeight } = await req.json();

    if (!process.env.SHIPPO_API_TOKEN) {
      return NextResponse.json({ error: "Missing SHIPPO_API_TOKEN." }, { status: 500 });
    }

    if (!paymentId || !rateId) {
      return NextResponse.json({ error: "paymentId and rateId are required." }, { status: 400 });
    }

    const response = await fetch(`${SHIPPO_API_URL}/transactions/`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rate: rateId,
        label_file_type: "PDF",
        async: false,
      }),
    });

    const transaction = await response.json();

    const status = String(transaction.object_status || transaction.status || "").toUpperCase();

   if (!response.ok) {
      return NextResponse.json(
        {
          error: "Shippo could not purchase the label.",
          status,
          details: transaction,
        },
        { status: 500 }
      );
    }

    const labelUrl =
      transaction.label_url ||
      transaction.label_url_pdf ||
      transaction.label_url_png ||
      null;
if (!labelUrl) {
  console.error("Shippo transaction without label URL:", transaction);

  return NextResponse.json(
    {
      error: "Shippo created a transaction, but no label URL was returned.",
      details: transaction,
    },
    { status: 500 }
  );
}
    const trackingUrl =
      transaction.tracking_url_provider ||
      transaction.tracking_url ||
      null;

    const supabase = getSupabaseAdmin();

    const { data: updatedRows, error: updateError } = await supabase
      .from("payments")
      .update({
        shippo_transaction_id: transaction.object_id || null,
        label_url: labelUrl,
        tracking_number: transaction.tracking_number || null,
        tracking_url: trackingUrl,
        carrier: transaction.rate?.provider || transaction.carrier || null,
        service_level:
          transaction.rate?.servicelevel?.name ||
          transaction.servicelevel_name ||
          null,
        package_weight: packageWeight || null,
      })
      .eq("id", paymentId)
      .select("id, label_url, tracking_number, tracking_url");

    if (updateError) {
      return NextResponse.json(
        {
          error: "Label created, but Supabase did not save it.",
          details: updateError.message,
          transaction,
        },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          error: "Label created, but no matching payment row was found in Supabase.",
          paymentId,
          transaction,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      labelUrl,
      trackingNumber: transaction.tracking_number || null,
      trackingUrl,
      updatedPayment: updatedRows[0],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
