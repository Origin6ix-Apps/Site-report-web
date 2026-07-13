-- SCOPE OF WORK
-- A free-text field describing what the project actually covers, set by
-- Admin when creating a project, visible everywhere the project appears.
-- Run in Supabase SQL Editor. Safe to re-run.

alter table projects add column if not exists scope_of_work text default '';
