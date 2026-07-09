-- REMOVE APPROVAL GATE
-- Run this in Supabase SQL Editor AFTER schema.sql and schema_v2_roles.sql.
-- Safe to re-run.

-- Replace the signup trigger: instead of "first user = admin, everyone else = pending",
-- the role is now whatever the person picked on the signup form (sent as user metadata).
-- Falls back to 'supervisor' if something unexpected comes through.
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

-- Trigger itself is unchanged (still on_auth_user_created), just re-pointing to the new function body.
