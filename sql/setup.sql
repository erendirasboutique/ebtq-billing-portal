create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  customer_name text,
  customer_email text,
  amount_total numeric,
  currency text default 'usd',
  payment_status text,
  payment_link text,
  description text,
  receipt_url text,
  raw_event jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists payments_customer_email_idx on payments (customer_email);
create index if not exists payments_created_at_idx on payments (created_at desc);

create table if not exists admins (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  active boolean not null default true,
  language text not null default 'en' check (language in ('en', 'es')),
  created_at timestamp with time zone default now()
);

create index if not exists admins_email_idx on admins (email);

alter table payments enable row level security;
alter table admins enable row level security;

-- This app reads private data only through server routes with SUPABASE_SERVICE_ROLE_KEY.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in browser code.

-- After creating each admin in Supabase Authentication, add their email here:
-- insert into admins (email, role) values ('your-email@example.com', 'owner');
