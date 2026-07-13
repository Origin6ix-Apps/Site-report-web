-- MATERIAL ORDER STATUS + ACCOUNTABILITY TRAIL
-- Adds a status (ordered / not_delivered / delivered) and a timestamp that
-- updates whenever the status changes, so Managers can see exactly what was
-- ordered, its current state, and when it last changed — per project, per
-- Supervisor.
-- Run in Supabase SQL Editor. Safe to re-run.

alter table materials add column if not exists status text not null default 'ordered'
  check (status in ('ordered','not_delivered','delivered'));
alter table materials add column if not exists status_updated_at timestamptz not null default now();
