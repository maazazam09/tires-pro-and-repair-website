-- Tire Pro & Repair - Supabase SQL for booking/contact submissions
--
-- What this is for:
-- The website booking/contact form posts to:
--   src/app/api/contact/route.ts
-- That API validates the payload and calls:
--   src/lib/submissions-store.ts -> saveFormSubmission()
--
-- Current storage behavior:
--   1. If FORM_SUBMISSIONS_STORAGE=blob and BLOB_READ_WRITE_TOKEN exists,
--      submissions are saved as private Vercel Blob JSON files under submissions/*.json.
--   2. Otherwise, or when FORM_SUBMISSIONS_STORAGE=database, submissions are saved
--      with Prisma into the FormSubmission table.
--
-- Run this SQL in Supabase SQL Editor before pointing DATABASE_URL to Supabase.
-- It uses the exact Prisma-compatible table/column names expected by the current app:
--   "FormSubmission"
--   "preferredDate"
--   "preferredTime"
--   "createdAt"
--
-- Important after running this SQL:
--   - Set DATABASE_URL to your Supabase Postgres connection string.
--   - Set FORM_SUBMISSIONS_STORAGE=database.
--   - Keep BLOB_READ_WRITE_TOKEN only if you still want old Blob submissions readable in admin.
--   - Do not use the public anon key from browser code for booking inserts.
--     The current /api/contact server route should remain the only public write path.

begin;

create extension if not exists pgcrypto;

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
  "createdAt" timestamp(3) without time zone not null default current_timestamp,

  constraint "FormSubmission_type_check"
    check ("type" in ('contact', 'quote')),
  constraint "FormSubmission_name_not_empty"
    check (length(btrim("name")) >= 2),
  constraint "FormSubmission_phone_not_empty"
    check (length(btrim("phone")) >= 7),
  constraint "FormSubmission_message_not_empty"
    check (length(btrim("message")) >= 5),
  constraint "FormSubmission_email_format"
    check ("email" = '' or "email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  constraint "FormSubmission_quote_requires_service"
    check ("type" <> 'quote' or length(btrim("service")) > 0),
  constraint "FormSubmission_quote_requires_preferredDate"
    check ("type" <> 'quote' or length(btrim("preferredDate")) > 0),
  constraint "FormSubmission_quote_requires_preferredTime"
    check ("type" <> 'quote' or length(btrim("preferredTime")) > 0)
);

create index if not exists "FormSubmission_createdAt_idx"
  on public."FormSubmission" ("createdAt" desc);

create index if not exists "FormSubmission_type_createdAt_idx"
  on public."FormSubmission" ("type", "createdAt" desc);

comment on table public."FormSubmission" is
  'Stores Tire Pro & Repair website contact messages and booking/quote requests from /api/contact.';
comment on column public."FormSubmission"."type" is
  'contact = normal contact message, quote = booking/request quote form.';
comment on column public."FormSubmission"."service" is
  'Required by the app only when type = quote.';
comment on column public."FormSubmission"."preferredDate" is
  'Required by the app only when type = quote. Stored as text because the current form sends yyyy-mm-dd strings.';
comment on column public."FormSubmission"."preferredTime" is
  'Required by the app only when type = quote. Stored as text because the current form sends display labels such as 10:00 AM - 12:00 PM.';

-- RLS setup
--
-- Recommended policy for the current app:
-- Enable RLS and create no public anon/authenticated policies.
-- The website should write through the server-side /api/contact route using the
-- Supabase database connection string. Supabase Dashboard/admin/service access
-- can still manage rows. This prevents direct public reads/writes through
-- Supabase client-side anon access.
alter table public."FormSubmission" enable row level security;

-- Optional admin policy:
-- Only use this if you later add Supabase Auth and want authenticated Supabase
-- users to read submissions through Supabase APIs. Leave it commented for now.
--
-- create policy "Authenticated admins can read form submissions"
--   on public."FormSubmission"
--   for select
--   to authenticated
--   using (true);

-- Optional public insert policy:
-- Not recommended for this app because validation/rate limiting should stay in
-- /api/contact. Leave commented unless you intentionally build direct Supabase
-- browser inserts.
--
-- create policy "Public can create form submissions"
--   on public."FormSubmission"
--   for insert
--   to anon
--   with check (
--     "type" in ('contact', 'quote')
--     and length(btrim("name")) >= 2
--     and length(btrim("phone")) >= 7
--     and length(btrim("message")) >= 5
--     and ("email" = '' or "email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
--     and ("type" <> 'quote' or (
--       length(btrim("service")) > 0
--       and length(btrim("preferredDate")) > 0
--       and length(btrim("preferredTime")) > 0
--     ))
--   );

commit;

-- Quick test insert for Supabase SQL Editor.
-- Run after the migration if you want to verify the table, then delete the row.
--
-- insert into public."FormSubmission"
--   ("type", "name", "phone", "email", "service", "preferredDate", "preferredTime", "message")
-- values
--   ('quote', 'Test Customer', '(530) 555-1234', 'test@example.com', 'New Tires', '2026-07-18', '10:00 AM - 12:00 PM', 'Test booking from Supabase SQL setup.');
--
-- select * from public."FormSubmission" order by "createdAt" desc limit 5;
--
-- delete from public."FormSubmission" where "email" = 'test@example.com';
