-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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

-- Owners can fully manage their own projects
create policy "projects_owner_select" on projects for select using (owner_id = auth.uid());
create policy "projects_owner_insert" on projects for insert with check (owner_id = auth.uid());
create policy "projects_owner_update" on projects for update using (owner_id = auth.uid());
create policy "projects_owner_delete" on projects for delete using (owner_id = auth.uid());

-- Owners can manage reports that belong to their own projects
create policy "reports_owner_select" on reports for select using (
  exists (select 1 from projects p where p.id = reports.project_id and p.owner_id = auth.uid())
);
create policy "reports_owner_insert" on reports for insert with check (
  exists (select 1 from projects p where p.id = reports.project_id and p.owner_id = auth.uid())
);
create policy "reports_owner_delete" on reports for delete using (
  exists (select 1 from projects p where p.id = reports.project_id and p.owner_id = auth.uid())
);

-- Storage bucket for site photos (public read, authenticated write)
insert into storage.buckets (id, name, public)
values ('site-photos', 'site-photos', true)
on conflict (id) do nothing;

create policy "site_photos_public_read" on storage.objects for select using (bucket_id = 'site-photos');
create policy "site_photos_auth_write" on storage.objects for insert with check (bucket_id = 'site-photos' and auth.role() = 'authenticated');
