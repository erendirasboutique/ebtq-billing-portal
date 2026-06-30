create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin',
  language text default 'en',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  payment_source text default 'stripe',

  stripe_session_id text unique,
  stripe_payment_intent text,
  stripe_customer_id text,
  payment_link text,

  clover_payment_id text unique,
  clover_order_id text,
  clover_merchant_id text,
  clover_tender text,

  customer_name text,
  customer_email text,
  customer_phone text,

  amount_total numeric default 0,
  currency text default 'usd',
  payment_status text,
  refund_status text default 'none',
  payment_method text,
  payment_method_brand text,
  payment_method_last4 text,

  billing_address jsonb,
  shipping_address jsonb,
  description text,
  receipt_url text,
  admin_notes text,
  raw jsonb,
  created_at timestamptz default now()
);

alter table public.admins enable row level security;
alter table public.payments enable row level security;

create unique index if not exists payments_stripe_session_id_key on public.payments (stripe_session_id);
create unique index if not exists payments_clover_payment_id_key on public.payments (clover_payment_id);
