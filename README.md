# Erendira's Boutique Payment Portal

This is a GitHub + Vercel ready Next.js project for:

- Admin portal: `/admin`
- Customer portal: `/customer`
- Stripe Payment Link webhook: `/api/stripe-webhook`
- Supabase database storage
- Erendira's Boutique branding, colors, footer, logo placeholder, and font setup

## 1. Upload to GitHub

Unzip this folder, then upload/push the full folder to a new GitHub repo.

## 2. Create the Supabase table

In Supabase, go to **SQL Editor** and run:

```sql
sql/setup.sql
```

Or copy/paste the SQL from that file.

## 3. Add environment variables in Vercel

In Vercel, go to your project:

**Settings → Environment Variables**

Add these:

```txt
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_webhook
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=make-your-own-password
ADMIN_SESSION_SECRET=make-a-long-random-secret
```

Never put real secrets directly in GitHub.

## 4. Stripe webhook setup

In Stripe:

**Developers → Webhooks → Add endpoint**

Endpoint URL:

```txt
https://your-vercel-domain.vercel.app/api/stripe-webhook
```

Event to select:

```txt
checkout.session.completed
```

Copy the webhook signing secret that starts with `whsec_` and put it into Vercel as:

```txt
STRIPE_WEBHOOK_SECRET
```

Redeploy Vercel after adding environment variables.

## 5. Customer login setup in Supabase

In Supabase:

**Authentication → URL Configuration**

Add your site URL:

```txt
https://your-vercel-domain.vercel.app
```

Add redirect URL:

```txt
https://your-vercel-domain.vercel.app/customer
```

Customers will enter their email, get a magic login link, and only see payments matching that logged-in email.

## 6. Fonts

Put your real font files into:

```txt
public/fonts
```

The project already looks for:

```txt
MDNichrome-Bold.woff2
MDNichrome-Bold.woff
MDNichrome-Bold.ttf
BringBoldNineties.woff2
BringBoldNineties.woff
BringBoldNineties.ttf
```

If the exact files are missing, the site falls back to Arial.

## 7. Branding edits

Main styling is here:

```txt
app/globals.css
```

Logo placeholder is here:

```txt
public/logo.svg
```

Replace it with your real `logo.png` if you want, then update image paths from `/logo.svg` to `/logo.png` in:

```txt
components/Header.js
components/Footer.js
```

## Important security note

The customer portal does not allow someone to simply type an email and view payments. It requires a Supabase email login link first.

The admin portal is password protected using your Vercel environment variables.

## Branding files

This project is now wired for the Erendira's Boutique visual style:

- Headings: `BringBoldNineties`
- Paragraphs/buttons/nav/forms/tables: `MDNichrome-Bold`
- Colors: purple base with green accents
- Decorative flowers: `public/flowers/`
- Logo path used by the portal: `public/logo.png`
- Favicon path: `public/favicon.svg`

To use your exact boutique assets, replace these files but keep the names the same:

```txt
public/logo.png
public/favicon.svg
public/fonts/BringBoldNineties.woff2
public/fonts/MDNichrome-Bold.woff2
```

Do not upload your Stripe secret key or Supabase service role key into GitHub. Add them only inside Vercel Environment Variables.
