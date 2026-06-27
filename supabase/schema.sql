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
  stripe_customer_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  amount_total numeric not null default 0,
  currency text not null default 'usd',
  payment_status text,
  refund_status text not null default 'none',
  payment_method text,
  payment_method_brand text,
  payment_method_last4 text,
  billing_address jsonb,
  shipping_address jsonb,
  payment_link text,
  description text,
  receipt_url text,
  admin_notes text,
  raw jsonb,
  created_at timestamptz not null default now()
);

-- Run-safe migrations for existing projects
alter table public.payments add column if not exists stripe_payment_intent text;
alter table public.payments add column if not exists stripe_customer_id text;
alter table public.payments add column if not exists customer_phone text;
alter table public.payments add column if not exists refund_status text not null default 'none';
alter table public.payments add column if not exists payment_method text;
alter table public.payments add column if not exists payment_method_brand text;
alter table public.payments add column if not exists payment_method_last4 text;
alter table public.payments add column if not exists billing_address jsonb;
alter table public.payments add column if not exists shipping_address jsonb;
alter table public.payments add column if not exists admin_notes text;
alter table public.payments add column if not exists raw jsonb;
alter table public.payments add column if not exists receipt_url text;
alter table public.payments add column if not exists description text;

create unique index if not exists payments_stripe_session_id_key on public.payments (stripe_session_id);
create index if not exists payments_customer_email_idx on public.payments (customer_email);
create index if not exists payments_created_at_idx on public.payments (created_at desc);
create index if not exists payments_payment_status_idx on public.payments (payment_status);

alter table public.admins enable row level security;
alter table public.payments enable row level security;

-- This app reads/writes these tables through secure server routes using the Supabase service role key.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser.
