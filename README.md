# Erendira's Boutique Billing Portal V2

Billing-only portal for Erendira's Boutique.

## Includes

- Customer portal at `/`
- Admin portal at `/admin/login`
- Stripe webhook at `/api/stripe-webhook`
- Clover manual sync at `/api/admin/clover-sync`
- Supabase Auth admin login
- Supabase customer magic-link login
- Stripe + Clover payments in one `payments` table
- Receipts, payment method, customer history, notes, CSV export, print view
- Erendira's Boutique branding with logo/favicon and font paths

## Important

This project does **not** include shipping, Shippo, Ship.com, inventory, RSVP, or Typeform.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Create your admin in Authentication → Users.
4. Copy the user's UID.
5. Insert the admin row:

```sql
insert into public.admins (id, email, role, language, active)
values ('PASTE_AUTH_USER_UID', 'your@email.com', 'owner', 'en', true);
```

## Vercel environment variables

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app

STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

CLOVER_API_TOKEN=
CLOVER_MERCHANT_ID=
CLOVER_ENV=production
```

## Stripe webhook

Endpoint:

```txt
https://your-project.vercel.app/api/stripe-webhook
```

Event:

```txt
checkout.session.completed
```

## Fonts

Place your font files here:

```txt
public/fonts/bringbold_nineties_regular.otf
public/fonts/MDNichrome-Bold.otf
```

The CSS already references those exact file names.
