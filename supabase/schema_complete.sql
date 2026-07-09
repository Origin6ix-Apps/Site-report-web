-- SITE REPORT AI — COMPLETE SCHEMA (run this single file top to bottom)
-- Safe to re-run anytime — every statement either checks "if not exists" or
-- drops/replaces before creating, so running this twice won't break anything.

create extension if not exists "pgcrypto";

-- ========== 1. PROJECTS & REPORTS (base tables) ==========

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  client text not null default '',
  location text not null default '',
  share_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  report_date text not null,
  transcript text default '',
  summary text default '',
  work_completed jsonb default '[]',
  materials_equipment jsonb default '[]',
  crew_on_site text default '',
  safety_notes jsonb default '[]',
  issues_delays jsonb default '[]',
  plan_for_tomorrow jsonb default '[]',
  photo_urls jsonb default '[]',
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
alter table reports enable row level security;

insert into storage.buckets (id, name, public)
values ('site-photos', 'site-photos', true)
on conflict (id) do nothing;

drop policy if exists "site_photos_public_read" on storage.objects;
create policy "site_photos_public_read" on storage.objects for select using (bucket_id = 'site-photos');
drop policy if exists "site_photos_auth_write" on storage.objects;
create policy "site_photos_auth_write" on storage.objects for insert with check (bucket_id = 'site-photos' and auth.role() = 'authenticated');

-- ========== 2. PROFILES & ROLES ==========

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'supervisor' check (role in ('pending','manager','admin','supervisor')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin_manager" on profiles;
create policy "profiles_select_own_or_admin_manager" on profiles for select using (
  id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());

drop policy if exists "profiles_admin_update_any" on profiles;
create policy "profiles_admin_update_any" on profiles for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or id = auth.uid()
);

-- New signups get access immediately — role comes from what they picked at signup
-- (or 'supervisor' by default). No approval step. Admins can change anyone's role
-- anytime from the Users tab.
create or replace function handle_new_user()
returns trigger as $$
declare
  requested_role text;
  final_role text;
begin
  requested_role := new.raw_user_meta_data->>'role';
  if requested_role in ('admin','manager','supervisor') then
    final_role := requested_role;
  else
    final_role := 'supervisor';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), final_role);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: fix any existing accounts still stuck as 'pending' from before this change
update profiles set role = 'supervisor' where role = 'pending';

-- ========== 3. PROJECTS: company-wide fields + role-based access ==========

alter table projects add column if not exists point_of_contact text default '';
alter table projects add column if not exists completion_percentage int not null default 0 check (completion_percentage between 0 and 100);
alter table projects add column if not exists assigned_supervisor_id uuid references auth.users(id);
alter table projects add column if not exists status text not null default 'active' check (status in ('active','on_hold','completed'));

drop policy if exists "projects_owner_select" on projects;
drop policy if exists "projects_owner_insert" on projects;
drop policy if exists "projects_owner_update" on projects;
drop policy if exists "projects_owner_delete" on projects;
drop policy if exists "projects_select_by_role" on projects;
drop policy if exists "projects_admin_insert" on projects;
drop policy if exists "projects_admin_update" on projects;
drop policy if exists "projects_admin_delete" on projects;

create policy "projects_select_by_role" on projects for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or assigned_supervisor_id = auth.uid()
);
create policy "projects_admin_insert" on projects for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "projects_admin_update" on projects for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or assigned_supervisor_id = auth.uid()
);
create policy "projects_admin_delete" on projects for delete using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "reports_owner_select" on reports;
drop policy if exists "reports_owner_insert" on reports;
drop policy if exists "reports_owner_delete" on reports;
drop policy if exists "reports_select_by_role" on reports;
drop policy if exists "reports_insert_by_role" on reports;

create policy "reports_select_by_role" on reports for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = reports.project_id and pr.assigned_supervisor_id = auth.uid())
);
create policy "reports_insert_by_role" on reports for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = reports.project_id and pr.assigned_supervisor_id = auth.uid())
);

-- ========== 4. EMPLOYEES ==========

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  name text not null,
  trade text default '',
  phone text default '',
  site_location text default '',
  added_by uuid references auth.users(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table employees enable row level security;

drop policy if exists "employees_select_by_role" on employees;
create policy "employees_select_by_role" on employees for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = employees.project_id and pr.assigned_supervisor_id = auth.uid())
);
drop policy if exists "employees_write_by_role" on employees;
create policy "employees_write_by_role" on employees for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','supervisor'))
);
drop policy if exists "employees_update_by_role" on employees;
create policy "employees_update_by_role" on employees for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (select 1 from projects pr where pr.id = employees.project_id and pr.assigned_supervisor_id = auth.uid())
);
drop policy if exists "employees_delete_by_role" on employees;
create policy "employees_delete_by_role" on employees for delete using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (select 1 from projects pr where pr.id = employees.project_id and pr.assigned_supervisor_id = auth.uid())
);

-- ========== 5. ATTENDANCE ==========

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  attendance_date date not null default current_date,
  status text not null default 'present' check (status in ('present','absent','half_day')),
  marked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (employee_id, attendance_date)
);

alter table attendance enable row level security;

drop policy if exists "attendance_select_by_role" on attendance;
create policy "attendance_select_by_role" on attendance for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = attendance.project_id and pr.assigned_supervisor_id = auth.uid())
);
drop policy if exists "attendance_write_by_role" on attendance;
create policy "attendance_write_by_role" on attendance for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','supervisor'))
);
drop policy if exists "attendance_update_by_role" on attendance;
create policy "attendance_update_by_role" on attendance for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (select 1 from projects pr where pr.id = attendance.project_id and pr.assigned_supervisor_id = auth.uid())
);

-- ========== 6. RESOURCE REQUESTS ==========

create table if not exists resource_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  requested_by uuid references auth.users(id),
  request_type text not null default 'material' check (request_type in ('material','employee')),
  description text not null default '',
  quantity text default '',
  status text not null default 'pending' check (status in ('pending','approved','fulfilled','declined')),
  created_at timestamptz not null default now()
);

alter table resource_requests enable row level security;

drop policy if exists "requests_select_by_role" on resource_requests;
create policy "requests_select_by_role" on resource_requests for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = resource_requests.project_id and pr.assigned_supervisor_id = auth.uid())
);
drop policy if exists "requests_write_by_role" on resource_requests;
create policy "requests_write_by_role" on resource_requests for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','supervisor'))
);
drop policy if exists "requests_update_by_role" on resource_requests;
create policy "requests_update_by_role" on resource_requests for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
);

-- Done. Every new signup gets a profile automatically with role 'supervisor'
-- (or whatever they picked, if your signup form sends one). Any existing
-- accounts previously stuck on 'pending' were just fixed above.
