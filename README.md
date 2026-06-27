# Erendira's Boutique Billing Portal

Clean billing-only portal for GitHub + Vercel + Supabase + Stripe.

## Routes

- `/` customer billing portal
- `/customer` same customer billing portal
- `/admin/login` admin login
- `/admin` protected payments dashboard
- `/api/stripe-webhook` Stripe webhook endpoint

## Setup

### 1. Supabase

Create a Supabase project, then run `supabase/schema.sql` in SQL Editor.

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

## Branding

The real logo and favicon are already included:

- `public/logo.png`
- `public/favicon.png`

Font files are not included. Add your licensed font files here:

- `public/fonts/BringBoldNineties.woff2`
- `public/fonts/MDNichrome-Bold.woff2`

The CSS already points to those filenames.
