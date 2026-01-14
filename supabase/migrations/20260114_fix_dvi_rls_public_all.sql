-- Fix RLS Policies for ALL DVI Tables (Public/Anon Access)
-- Resolves "new row violates row-level security policy" errors for inspections

-- 1. Inspections
drop policy if exists "Enable all access for authenticated users" on inspections;
drop policy if exists "Enable insert for authenticated users" on inspections;
drop policy if exists "Public read inspections by token" on inspections;

create policy "Public insert inspections" 
on inspections for insert 
with check (true);

create policy "Public update inspections" 
on inspections for update 
using (true);

create policy "Public select inspections" 
on inspections for select 
using (true);

-- 2. Inspection Items
drop policy if exists "Enable all access for authenticated users" on inspection_items;
drop policy if exists "Public read items" on inspection_items;
drop policy if exists "Public update decision" on inspection_items;

create policy "Public insert items" 
on inspection_items for insert 
with check (true);

create policy "Public update items" 
on inspection_items for update 
using (true);

create policy "Public select items" 
on inspection_items for select 
using (true);

create policy "Public delete items" 
on inspection_items for delete 
using (true);

-- 3. Inspection Photos
drop policy if exists "Enable all access for authenticated users" on inspection_photos;
drop policy if exists "Public read photos" on inspection_photos;

create policy "Public insert photos" 
on inspection_photos for insert 
with check (true);

create policy "Public update photos" 
on inspection_photos for update 
using (true);

create policy "Public select photos" 
on inspection_photos for select 
using (true);

create policy "Public delete photos" 
on inspection_photos for delete 
using (true);
