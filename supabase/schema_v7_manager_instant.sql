-- MANAGER SIGNUP GETS INSTANT ACCESS
-- Everyone else (Admin, Supervisor) still starts as Pending and needs to be
-- assigned by an Admin or Manager. Only 'manager' is honored from signup
-- metadata — no other role can be self-assigned this way.
-- Run in Supabase SQL Editor. Safe to re-run.

create or replace function handle_new_user()
returns trigger as $$
declare
  requested_role text;
  final_role text;
begin
  requested_role := new.raw_user_meta_data->>'role';

  if requested_role = 'manager' then
    final_role := 'manager';
  else
    final_role := 'pending';
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    final_role
  );
  return new;
end;
$$ language plpgsql security definer;