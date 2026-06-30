# Erendira's Boutique Billing Portal V3

Billing-only portal for Stripe + Clover payments.

## Pages
- `/` Customer portal
- `/admin/login` Admin login
- `/admin` Admin dashboard

## Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Add Vercel environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SITE_URL
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - CLOVER_API_TOKEN
   - CLOVER_MERCHANT_ID
   - CLOVER_ENV=production
4. In Supabase Auth URL configuration:
   - Site URL: your Vercel URL
   - Redirect URL: your Vercel URL/*
5. In Stripe webhook destinations:
   - Endpoint: https://your-domain.com/api/stripe-webhook
   - Event: checkout.session.completed
6. Create admin in Supabase Auth, then insert matching UID into `admins`.
