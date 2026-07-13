-- FIX: infinite recursion in profiles RLS policies
-- The profiles table's own policies were checking "is this user admin/manager?"
-- by querying profiles again — which re-triggers the same policy check forever.
-- Postgres correctly refuses this with error 42P17.
--
-- Fix: move that check into a SECURITY DEFINER function, which runs with
-- elevated privileges and bypasses RLS internally — breaking the loop.
-- This ONLY affects the two policies defined directly ON the profiles table.
-- Every other table's policies (projects, employees, attendance, etc.) query
-- profiles from a different table's policy, which was never recursive and
-- doesn't need to change.
--
-- Run in Supabase SQL Editor. Safe to re-run.

create or replace function is_admin_or_manager(check_id uuid)
returns boolean as $$
  select exists (
    select 1 from profiles where id = check_id and role in ('admin','manager')
  );
$$ language sql security definer stable;

drop policy if exists "profiles_select_own_or_admin_manager" on profiles;
create policy "profiles_select_own_or_admin_manager" on profiles for select using (
  id = auth.uid() or is_admin_or_manager(auth.uid())
);

drop policy if exists "profiles_admin_update_any" on profiles;
create policy "profiles_admin_update_any" on profiles for update using (
  id = auth.uid() or is_admin_or_manager(auth.uid())
);
