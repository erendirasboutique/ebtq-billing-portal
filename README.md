# Erendira's Boutique Billing Portal

Clean billing-only portal for GitHub + Vercel + Supabase + Stripe.

## Routes

- `/` customer billing portal
- `/customer` same customer billing portal
- `/admin/login` admin login
- `/admin` protected payments dashboard
- `/api/stripe-webhook` Stripe webhook endpoint

## What's included

### Customer portal
- All-time payment history
- Receipt links
- Payment method used
- Billing address
- Shipping address
- Payment/order ID
- English/Spanish language selector

### Admin portal
- All-time payment history
- All-time revenue and filtered revenue
- Total payments, paid orders, customers, latest payment
- Search by name, email, phone, status, address, Stripe ID, etc.
- Filter by status/refund status
- Filter by date range
- CSV export with full payment details
- Payment method, phone, billing address, shipping address
- Stripe customer ID, payment intent ID, checkout session ID, payment link ID
- Open in Stripe links
- Customer lifetime total
- Private admin notes

## Setup

### 1. Supabase

Create a Supabase project, then run `supabase/schema.sql` in SQL Editor.

If your project already exists, still run the same file. It uses safe `if not exists` migrations for the new columns.

### 2. Vercel environment variables

Add all variables from `.env.example` in Vercel Project Settings → Environment Variables.

`NEXT_PUBLIC_SITE_URL` must be your live Vercel URL, for example:

```txt
https://your-project.vercel.app
```

### 3. Supabase Auth URL settings

Supabase → Authentication → URL Configuration:

Site URL:

```txt
https://your-project.vercel.app
```

Redirect URLs:

```txt
https://your-project.vercel.app/*
```

### 4. Create admin users

Supabase → Authentication → Users → Add User.

Turn on Auto Confirm User, set an email and password.

Copy that user's UID.

Then insert into `public.admins`:

```txt
id: copied UID
email: same email
role: owner
language: en
active: true
```

Only users in `public.admins` with `active = true` can access `/admin`.

### 5. Stripe webhook

Stripe → Developers → Event destinations / Webhooks → Add destination.

Endpoint:

```txt
https://your-project.vercel.app/api/stripe-webhook
```

Event:

```txt
checkout.session.completed
```

Copy the signing secret (`whsec_...`) into Vercel as `STRIPE_WEBHOOK_SECRET`, then redeploy.

## Important after updating

After uploading this version:

1. Run `supabase/schema.sql` again in Supabase SQL Editor.
2. Commit/push to GitHub.
3. Redeploy Vercel.
4. In Stripe, resend a recent successful `checkout.session.completed` webhook if you want the new fields to backfill for that payment.

Older rows may not have payment method/address fields until the webhook is resent or a new payment comes in.

## Branding

The real logo and favicon are already included:

- `public/logo.png`
- `public/favicon.png`

Font files are not included. Add your licensed font files here:

- `public/fonts/BringBoldNineties.woff2`
- `public/fonts/MDNichrome-Bold.woff2`

The CSS already points to those filenames.
