# Erendira's Boutique Portal

GitHub/Vercel-ready Next.js portal for Erendira's Boutique.

## What is included

- Customer portal at `/`
- Admin login at `/admin/login`
- Protected admin dashboard at `/admin`
- Multiple admin accounts through Supabase Auth
- Admin roles: `owner`, `admin`, `staff`
- English/Spanish language selector
- Stripe Payment Link webhook at `/api/stripe-webhook`
- Supabase database SQL in `sql/setup.sql`
- Erendira's Boutique logo, favicon, purple/green accents, flowers, and font placeholders

## Important font note

Put your real font files here:

```txt
public/fonts/BringBoldNineties.woff2
public/fonts/MDNichrome-Bold.woff2
```

The CSS already looks for those names. If the file names are different, rename them to exactly those names.

## 1. Upload to GitHub

Upload everything in this folder to a new GitHub repository.

## 2. Deploy on Vercel

Import the GitHub repository into Vercel.

Add these environment variables in Vercel:

```txt
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-vercel-site.vercel.app
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Then redeploy.

## 3. Supabase setup

In Supabase, go to SQL Editor and run:

```txt
sql/setup.sql
```

## 4. Create admin users

Go to:

```txt
Supabase → Authentication → Users → Add user
```

Create each admin with their email and password.

Then go to SQL Editor and add that same email to the `admins` table:

```sql
insert into admins (email, role)
values ('your-email@example.com', 'owner');
```

More examples:

```sql
insert into admins (email, role) values ('erendira@example.com', 'admin');
insert into admins (email, role) values ('staff@example.com', 'staff');
```

Only emails listed in the `admins` table can access `/admin`.

## 5. Customer magic link setup

In Supabase, go to:

```txt
Authentication → URL Configuration
```

Set Site URL:

```txt
https://your-vercel-site.vercel.app
```

Add Redirect URL:

```txt
https://your-vercel-site.vercel.app/*
```

This fixes the `localhost refused to connect` magic-link error.

## 6. Stripe webhook setup

In Stripe, go to:

```txt
Developers → Event destinations → Add destination
```

Use endpoint:

```txt
https://your-vercel-site.vercel.app/api/stripe-webhook
```

Select event:

```txt
checkout.session.completed
```

Copy the signing secret that starts with `whsec_` and put it in Vercel as:

```txt
STRIPE_WEBHOOK_SECRET
```

Then redeploy Vercel.
