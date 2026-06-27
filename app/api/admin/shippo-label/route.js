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
      return NextResponse.json(
        { error: "paymentId and rateId are required." },
        { status: 400 }
      );
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

    if (!response.ok || transaction.object_status !== "SUCCESS") {
      return NextResponse.json(
        { error: "Shippo could not purchase the label.", details: transaction },
        { status: response.status || 500 }
      );
    }

    const supabase = getSupabaseAdmin();

    await supabase
      .from("payments")
      .update({
        shippo_transaction_id: transaction.object_id,
        label_url: transaction.label_url,
        tracking_number: transaction.tracking_number,
        tracking_url: transaction.tracking_url_provider,
        carrier: transaction.rate?.provider || transaction.carrier || null,
        service_level:
          transaction.rate?.servicelevel?.name ||
          transaction.servicelevel_name ||
          null,
        package_weight: packageWeight || null,
      })
      .eq("id", paymentId);

    return NextResponse.json({
      success: true,
      transactionId: transaction.object_id,
      labelUrl: transaction.label_url,
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
      carrier: transaction.rate?.provider || transaction.carrier || null,
      serviceLevel:
        transaction.rate?.servicelevel?.name ||
        transaction.servicelevel_name ||
        null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
