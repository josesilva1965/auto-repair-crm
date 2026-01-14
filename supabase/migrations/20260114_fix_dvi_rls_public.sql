-- Fix RLS Policies for DVI System (Public/Anon Access)
-- Resolves "new row violates row-level security policy" errors (42501)
-- Allows creation of templates without strict authentication

-- 1. Inspection Templates
-- Drop existing policies
drop policy if exists "Enable write access for authenticated users" on inspection_templates;
drop policy if exists "Enable insert for authenticated users" on inspection_templates;
drop policy if exists "Enable update for authenticated users" on inspection_templates;
drop policy if exists "Enable delete for authenticated users" on inspection_templates;

-- Create Public policies
create policy "Public insert templates" 
on inspection_templates for insert 
with check (true);

create policy "Public update templates" 
on inspection_templates for update 
using (true);

create policy "Public delete templates" 
on inspection_templates for delete 
using (true);

-- 2. Template Items
drop policy if exists "Enable write access for authenticated users" on template_items;
drop policy if exists "Enable insert for authenticated users" on template_items;
drop policy if exists "Enable update for authenticated users" on template_items;
drop policy if exists "Enable delete for authenticated users" on template_items;

create policy "Public insert template items" 
on template_items for insert 
with check (true);

create policy "Public update template items" 
on template_items for update 
using (true);

create policy "Public delete template items" 
on template_items for delete 
using (true);
