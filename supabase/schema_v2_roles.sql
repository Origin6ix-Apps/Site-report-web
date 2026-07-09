-- ROLES & COMPANY DASHBOARD SCHEMA
-- Run this in Supabase SQL Editor AFTER the original schema.sql.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).

-- 1. PROFILES: extends auth.users with a role
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'pending' check (role in ('pending','manager','admin','supervisor')),
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

-- Auto-create a profile row whenever someone signs up.
-- The very first person to ever sign up becomes 'admin' automatically (bootstrap).
-- Everyone after that starts as 'pending' until an admin assigns a real role.
create or replace function handle_new_user()
returns trigger as $$
declare
  existing_count int;
  assigned_role text;
begin
  select count(*) into existing_count from profiles;
  if existing_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := 'pending';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), assigned_role);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. PROJECTS: extend with company-wide fields (in addition to columns from schema.sql)
alter table projects add column if not exists point_of_contact text default '';
alter table projects add column if not exists completion_percentage int not null default 0 check (completion_percentage between 0 and 100);
alter table projects add column if not exists assigned_supervisor_id uuid references auth.users(id);
alter table projects add column if not exists status text not null default 'active' check (status in ('active','on_hold','completed'));

-- Replace old owner-based policies with role-based, company-wide policies.
drop policy if exists "projects_owner_select" on projects;
drop policy if exists "projects_owner_insert" on projects;
drop policy if exists "projects_owner_update" on projects;
drop policy if exists "projects_owner_delete" on projects;

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

-- Reports: update policy to match new role model (admin/manager see all, supervisor sees their project's reports)
drop policy if exists "reports_owner_select" on reports;
drop policy if exists "reports_owner_insert" on reports;
drop policy if exists "reports_owner_delete" on reports;

create policy "reports_select_by_role" on reports for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = reports.project_id and pr.assigned_supervisor_id = auth.uid())
);
create policy "reports_insert_by_role" on reports for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
  or exists (select 1 from projects pr where pr.id = reports.project_id and pr.assigned_supervisor_id = auth.uid())
);

-- 3. EMPLOYEES: records only, no login
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

-- 4. ATTENDANCE
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

-- 5. RESOURCE REQUESTS (material or additional employee requests from supervisors)
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
