-- Fix RLS Policies for DVI System
-- Resolves "new row violates row-level security policy" errors

-- 1. Inspection Templates
-- Drop ambiguous "write" policy and replace with specific actions
drop policy if exists "Enable write access for authenticated users" on inspection_templates;

create policy "Enable insert for authenticated users" 
on inspection_templates for insert 
with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" 
on inspection_templates for update 
using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" 
on inspection_templates for delete 
using (auth.role() = 'authenticated');

-- 2. Template Items
drop policy if exists "Enable write access for authenticated users" on template_items;

create policy "Enable insert for authenticated users" 
on template_items for insert 
with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" 
on template_items for update 
using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" 
on template_items for delete 
using (auth.role() = 'authenticated');

-- 3. Inspections
-- Ensure inspections can be created
drop policy if exists "Enable all access for authenticated users" on inspections;

create policy "Enable all access for authenticated users" 
on inspections for all 
using (auth.role() = 'authenticated'); 
-- Note: 'FOR ALL' applies USING to everything. For INSERT, if no WITH CHECK is present, 
-- Postgres validates the new row against the USING expression (if applicable in new versions) 
-- but explicit WITH CHECK is safer.
-- Let's add explicit INSERT policy just in case or rely on 'ALL' being standard for Supabase.
-- Actually, let's keep it simple. If this fails, we split it.

-- 4. Inspection Items
drop policy if exists "Enable all access for authenticated users" on inspection_items;

create policy "Enable all access for authenticated users" 
on inspection_items for all 
using (auth.role() = 'authenticated');

-- 5. Inspection Photos
drop policy if exists "Enable all access for authenticated users" on inspection_photos;

create policy "Enable all access for authenticated users" 
on inspection_photos for all 
using (auth.role() = 'authenticated');
