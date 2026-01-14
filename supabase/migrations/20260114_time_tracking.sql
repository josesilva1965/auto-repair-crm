create table if not exists time_logs (
  id uuid default gen_random_uuid() primary key,
  work_order_id uuid references work_orders(id) on delete cascade not null,
  technician_id uuid, -- Optional linking to auth users or staff table
  technician_name text,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  duration_minutes integer default 0,
  description text,
  created_at timestamptz default now()
);

-- RLS
alter table time_logs enable row level security;

-- Policy to allow all access for now (dev mode)
create policy "Enable all for authenticated users" on time_logs
    for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table time_logs;
