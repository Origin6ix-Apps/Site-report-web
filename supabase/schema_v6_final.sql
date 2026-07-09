-- WORKFORGE — FINAL FEATURE MIGRATION
-- Run this after schema_complete.sql (and schema_v4_manager_assigns.sql / schema_v5_final_roles.sql
-- if you ran those separately — this migration is compatible either way).
-- Safe to re-run.

-- 1. Phone number on profiles (captured at signup, shown to Managers on reports)
alter table profiles add column if not exists phone text default '';

-- 2. Deadline on projects
alter table projects add column if not exists deadline date;

-- 3. MATERIALS: stock used vs. required, logged by Supervisors per project
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  used numeric default 0,
  required numeric default 0,
  unit text default '',
  logged_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table materials enable row level security;

drop policy if exists "materials_select_by_role" on materials;
create policy "materials_select_by_role" on materials for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = materials.project_id and pr.assigned_supervisor_id = auth.uid())
);
drop policy if exists "materials_write_by_role" on materials;
create policy "materials_write_by_role" on materials for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','supervisor'))
);
drop policy if exists "materials_update_by_role" on materials;
create policy "materials_update_by_role" on materials for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (select 1 from projects pr where pr.id = materials.project_id and pr.assigned_supervisor_id = auth.uid())
);
drop policy if exists "materials_delete_by_role" on materials;
create policy "materials_delete_by_role" on materials for delete using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (select 1 from projects pr where pr.id = materials.project_id and pr.assigned_supervisor_id = auth.uid())
);

-- 4. DAILY LOGS: quick text + up to 8 photos, separate from the AI-generated Daily Reports
-- (that existing feature stays as-is). This is the simpler manual log Supervisors can post daily.
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  log_date date not null default current_date,
  text text default '',
  photo_urls jsonb default '[]',
  logged_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table daily_logs enable row level security;

drop policy if exists "daily_logs_select_by_role" on daily_logs;
create policy "daily_logs_select_by_role" on daily_logs for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = daily_logs.project_id and pr.assigned_supervisor_id = auth.uid())
);
drop policy if exists "daily_logs_write_by_role" on daily_logs;
create policy "daily_logs_write_by_role" on daily_logs for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','supervisor'))
);

-- 5. Allow Supervisors to update completion % on their own assigned projects
-- (projects_admin_update policy already covers this — confirming it's current)
drop policy if exists "projects_admin_update" on projects;
create policy "projects_admin_update" on projects for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or assigned_supervisor_id = auth.uid()
);
