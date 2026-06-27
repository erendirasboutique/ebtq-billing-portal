import { NextResponse } from "next/server";

const SHIPPO_API_URL = "https://api.goshippo.com";

const FROM_ADDRESS = {
  name: "ERENDIRAS BOUTIQUE LLC",
  company: "ERENDIRAS BOUTIQUE LLC",
  street1: "17121 Hawthorne Ave",
  city: "Fontana",
  state: "CA",
  zip: "92335",
  country: "US",
};

function normalizeAddress(address = {}) {
  return {
    name: address.name || address.customer_name || "Customer",
    street1: address.line1 || address.street1 || "",
    street2: address.line2 || address.street2 || "",
    city: address.city || "",
    state: address.state || "",
    zip: address.postal_code || address.zip || "",
    country: address.country || "US",
    phone: address.phone || "",
    email: address.email || "",
  };
}

export async function POST(req) {
  try {
    const { paymentId, shippingAddress, customerName, customerEmail, customerPhone, weight } =
      await req.json();

    if (!process.env.SHIPPO_API_TOKEN) {
      return NextResponse.json({ error: "Missing SHIPPO_API_TOKEN." }, { status: 500 });
    }

    if (!weight || Number(weight) <= 0) {
      return NextResponse.json({ error: "Package weight is required." }, { status: 400 });
    }

    const addressTo = normalizeAddress({
      ...shippingAddress,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    });

    const shipmentPayload = {
      address_from: FROM_ADDRESS,
      address_to: addressTo,
      parcels: [
        {
          length: "13",
          width: "10",
          height: "10",
          distance_unit: "in",
          weight: String(weight),
          mass_unit: "lb",
        },
      ],
      async: false,
      metadata: paymentId ? `payment:${paymentId}` : "erendiras-boutique",
    };

    const response = await fetch(`${SHIPPO_API_URL}/shipments/`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Shippo could not create rates.", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      shipmentId: data.object_id,
      rates: data.rates || [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
