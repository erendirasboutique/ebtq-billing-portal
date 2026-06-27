-- Erendira's Boutique Billing Portal schema

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin' check (role in ('owner','admin','staff')),
  language text not null default 'en' check (language in ('en','es')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent text,
  customer_name text,
  customer_email text,
  amount_total numeric not null default 0,
  currency text not null default 'usd',
  payment_status text,
  payment_link text,
  description text,
  receipt_url text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_customer_email_idx on public.payments (customer_email);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

alter table public.admins enable row level security;
alter table public.payments enable row level security;

-- This app reads/writes these tables through secure server routes using the Supabase service role key.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser.
