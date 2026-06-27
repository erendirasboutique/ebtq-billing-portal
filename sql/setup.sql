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

-- Optional safety policies if you ever query from the browser directly.
alter table payments enable row level security;

-- This app reads payments through server API routes using the Supabase service role key.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in client-side code.
