-- FIX: owner_id was required from the app's very first version (before roles
-- existed). The new Admin-created-projects flow doesn't set it, so inserts
-- were failing. Making it optional — assigned_supervisor_id is what the
-- current app actually uses to track project ownership.
-- Run in Supabase SQL Editor. Safe to re-run.

alter table projects alter column owner_id drop not null;
