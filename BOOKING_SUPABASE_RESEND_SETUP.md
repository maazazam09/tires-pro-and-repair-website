# Booking Storage + Resend Setup

## Where bookings currently go

The public form submits to:

- `src/components/forms/ContactForm.tsx`
- `src/app/api/contact/route.ts`
- `src/lib/submissions-store.ts`

Save order is already correct:

1. Validate form data.
2. Save booking/contact submission with `saveFormSubmission()`.
3. Send owner/admin email with `sendAdminSubmissionEmail()`.

If the save fails, the email is not sent.

## Supabase table

Run this file in Supabase SQL Editor:

- `supabase-booking-submissions-repair.sql`

After running it, the verification query must return:

```sql
public."FormSubmission"
```

Then the included test insert should work.

## Required environment variables

For Supabase booking storage:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
FORM_SUBMISSIONS_STORAGE="database"
```

Important:

- In production, remove or unset `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` if you want Supabase to be used.
- The current Prisma client chooses Turso first when both Turso and Supabase variables are present.
- Do not leave `DATABASE_URL` empty in production.
- Avoid duplicate `DATABASE_URL` lines in the same `.env` file.

For Resend owner/admin emails:

```env
RESEND_API_KEY="re_xxxxxxxxx"
ADMIN_NOTIFICATION_EMAIL="owner@example.com"
EMAIL_FROM="Tire Pro and Repair <bookings@your-verified-domain.com>"
```

Notes:

- `ADMIN_NOTIFICATION_EMAIL` is preferred for form emails.
- If `ADMIN_NOTIFICATION_EMAIL` is missing, the app falls back to `ADMIN_EMAIL`.
- `EMAIL_FROM` should use a verified Resend domain for production.
- The default `onboarding@resend.dev` is only suitable for initial testing and may have recipient/domain restrictions.

## Vercel production

Set these in Vercel Project Settings -> Environment Variables:

```env
DATABASE_URL=...
FORM_SUBMISSIONS_STORAGE=database
RESEND_API_KEY=...
ADMIN_NOTIFICATION_EMAIL=...
EMAIL_FROM=...
```

Then redeploy.

If Vercel still has these old variables, remove them when moving bookings to Supabase:

```env
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

Keep `BLOB_READ_WRITE_TOKEN` only if you still want old Vercel Blob submissions to be readable by the admin panel.

## RLS

The recommended setup enables RLS but creates no public insert/select policy.

That is intentional because the browser should not write directly to Supabase. Customers submit to `/api/contact`, and the server writes to the database.
