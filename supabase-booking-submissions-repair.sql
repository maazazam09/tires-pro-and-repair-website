-- Tire Pro & Repair - Supabase repair/check SQL for booking submissions
--
-- Use this when Supabase says:
--   ERROR: 42P01: relation "public.FormSubmission" does not exist
--
-- This means the table is not present in the Supabase database/schema where
-- you are running the insert. Run this whole file in Supabase SQL Editor.
-- It is safe to run more than once.

create schema if not exists public;
create extension if not exists pgcrypto with schema public;

create table if not exists public."FormSubmission" (
  "id" text primary key default gen_random_uuid()::text,
  "type" text not null,
  "name" text not null,
  "phone" text not null,
  "email" text not null default '',
  "service" text not null default '',
  "preferredDate" text not null default '',
  "preferredTime" text not null default '',
  "message" text not null,
  "createdAt" timestamp(3) without time zone not null default current_timestamp
);

-- Add/repair constraints idempotently.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_type_check'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_type_check"
      check ("type" in ('contact', 'quote'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_name_not_empty'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_name_not_empty"
      check (length(btrim("name")) >= 2);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_phone_not_empty'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_phone_not_empty"
      check (length(btrim("phone")) >= 7);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_message_not_empty'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_message_not_empty"
      check (length(btrim("message")) >= 5);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_email_format'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_email_format"
      check ("email" = '' or "email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_quote_requires_service'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_quote_requires_service"
      check ("type" <> 'quote' or length(btrim("service")) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_quote_requires_preferredDate'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_quote_requires_preferredDate"
      check ("type" <> 'quote' or length(btrim("preferredDate")) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'FormSubmission_quote_requires_preferredTime'
  ) then
    alter table public."FormSubmission"
      add constraint "FormSubmission_quote_requires_preferredTime"
      check ("type" <> 'quote' or length(btrim("preferredTime")) > 0);
  end if;
end $$;

create index if not exists "FormSubmission_createdAt_idx"
  on public."FormSubmission" ("createdAt" desc);

create index if not exists "FormSubmission_type_createdAt_idx"
  on public."FormSubmission" ("type", "createdAt" desc);

alter table public."FormSubmission" enable row level security;

comment on table public."FormSubmission" is
  'Stores Tire Pro & Repair website contact messages and booking/quote requests from /api/contact.';

-- Verification: this MUST return public."FormSubmission".
select to_regclass('public."FormSubmission"') as created_table;

-- Test insert: run after the verification returns public."FormSubmission".
insert into public."FormSubmission"
  ("type", "name", "phone", "email", "service", "preferredDate", "preferredTime", "message")
values
  ('quote', 'Test Customer', '(530) 555-1234', 'test@example.com', 'New Tires', '2026-07-18', '10:00 AM - 12:00 PM', 'Test booking from Supabase SQL setup.')
returning *;

-- Optional cleanup after test:
-- delete from public."FormSubmission" where "email" = 'test@example.com';
