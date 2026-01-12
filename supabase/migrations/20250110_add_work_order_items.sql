create table work_order_items (
  id uuid default uuid_generate_v4() primary key,
  work_order_id uuid references work_orders(id) on delete cascade not null,
  description text not null,
  quantity numeric default 1 not null,
  unit_price numeric default 0 not null,
  total_price numeric generated always as (quantity * unit_price) stored,
  item_type text check (item_type in ('part', 'labor', 'other')) default 'other',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table work_order_items enable row level security;

create policy "Enable read access for all users" on work_order_items
  for select using (true);

create policy "Enable insert access for all users" on work_order_items
  for insert with check (true);

create policy "Enable update access for all users" on work_order_items
  for update using (true);

create policy "Enable delete access for all users" on work_order_items
  for delete using (true);
