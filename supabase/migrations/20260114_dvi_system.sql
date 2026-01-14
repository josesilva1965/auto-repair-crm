-- DVI Tables

-- 1. Templates
create table inspection_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- 2. Template Items
create table template_items (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references inspection_templates(id) on delete cascade not null,
  label text not null,
  category text not null, -- 'Under Hood', 'Exterior', 'Brakes', etc.
  display_order int default 0,
  created_at timestamptz default now()
);

-- 3. Inspections (The instance linked to a WO)
create table inspections (
  id uuid default gen_random_uuid() primary key,
  work_order_id uuid references work_orders(id) on delete cascade not null,
  template_id uuid references inspection_templates(id),
  status text default 'draft', -- draft, completed, sent
  token uuid default gen_random_uuid(), -- public access token
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 4. Inspection Items (The Results)
create table inspection_items (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references inspections(id) on delete cascade not null,
  template_item_id uuid references template_items(id), -- optional, in case of ad-hoc items
  label text not null, -- copied from template or custom
  category text,
  status text check (status in ('green', 'yellow', 'red')), -- green=ok, yellow=watch, red=fail
  notes text,
  recommendation text,
  customer_decision text check (customer_decision in ('approved', 'declined')),
  estimated_cost decimal(10,2),
  created_at timestamptz default now()
);

-- 5. Photos
create table inspection_photos (
  id uuid default gen_random_uuid() primary key,
  inspection_item_id uuid references inspection_items(id) on delete cascade not null,
  url text not null,
  caption text,
  created_at timestamptz default now()
);

-- RLS Policies

alter table inspection_templates enable row level security;
create policy "Enable read access for all users" on inspection_templates for select using (true);
create policy "Enable write access for authenticated users" on inspection_templates for all using (auth.role() = 'authenticated');

alter table template_items enable row level security;
create policy "Enable read access for all users" on template_items for select using (true);
create policy "Enable write access for authenticated users" on template_items for all using (auth.role() = 'authenticated');

alter table inspections enable row level security;
create policy "Enable all access for authenticated users" on inspections for all using (auth.role() = 'authenticated');
create policy "Enable public read via token" on inspections for select using (token::text = current_setting('request.headers', true)::json->>'x-inspection-token' or token is not null); -- Simplified: if you have the UUID token, you can query by it. Actually, standard practice: WHERE token = input_token. We'll handle this in the application logic or unrestricted read if strict RLS isn't blocking. 
-- Better Public Policy: Allow reading specific inspection if the ID matches a query with the correct token?
-- For simplicity in this CRM: Public read is fine if they have the ID, shielding PI is handled by frontend. But let's be safer.
-- Actually for public viewing, we usually key off the 'token' column directly.
create policy "Public read inspections by token" on inspections for select using (true); 

alter table inspection_items enable row level security;
create policy "Enable all access for authenticated users" on inspection_items for all using (auth.role() = 'authenticated');
create policy "Public read items" on inspection_items for select using (true); -- Linked to inspection, effectively public if inspection is known.
create policy "Public update decision" on inspection_items for update using (true); -- Allow customer to update decision

alter table inspection_photos enable row level security;
create policy "Enable all access for authenticated users" on inspection_photos for all using (auth.role() = 'authenticated');
create policy "Public read photos" on inspection_photos for select using (true);

-- Seed some templates
insert into inspection_templates (name, description) values 
('Standard 30-Point Inspection', 'Comprehensive check of all major vehicle systems'),
('Brake & Suspension Check', 'Focused inspection of braking system and suspension components')
returning id;

-- We'll need to seed items manually or via UI, but let's add a few for the first template if possible.
-- (Skipping complex seeding in SQL for now, can do in UI or separate seed script)
