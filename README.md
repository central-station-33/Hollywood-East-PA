# Hollywood East PA

A two-sided marketplace for vetted, "Set-Ready" Production Assistants and
Coordinators in the NY/NJ ("Hollywood East") film & TV corridor. Producers
post a call time; the platform instantly invites every matching, verified,
Set-Ready PA; the first to accept is confirmed.

This positions the product against four categories of incumbent: full-service
staffing agencies, self-serve job boards (Staff Me Up, Mandy), entertainment
payroll platforms (Wrapbook, Cast & Crew), and informal Facebook/text
networks — by combining automated dispatch, NY/NJ tax-residency verification
(for production tax-credit compliance), and a certified on-set micro-course
into one flow.

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- Supabase (Postgres + Auth + Storage) via `@supabase/ssr`
- Tailwind CSS

## How it works

1. **PAs get Set-Ready.** A PA creates a profile (home state, role types,
   experience, payroll class) and passes a certified on-set micro-course
   (`src/lib/course.ts`). `pa_profiles.set_ready` is a generated column:
   currently just `course_completed_at is not null`. PAs can still upload a
   tax-residency document and get it admin-verified, but that no longer
   gates Set-Ready status — see `0004_disable_tax_residency_gate.sql` (the
   requirement can be restored by re-adding the `tax_residency_status =
   'verified'` clause to the generated expression).
2. **Producers post a call time.** Creating a gig (`gigs` table) triggers the
   `dispatch_gig_to_matches` Postgres function, which invites every Set-Ready
   PA in the matching state + role type (`dispatches` rows, status `invited`).
3. **First accept wins.** `accept_dispatch` (Postgres function) confirms that
   PA, flips the gig to `filled`, expires the other invites, and notifies the
   producer — all as one atomic, security-definer transaction so RLS can stay
   tightly scoped to "you can only touch your own rows."
4. **Admins vet compliance.** `/admin` reviews uploaded tax-residency docs
   (signed URLs from a private Supabase Storage bucket) and marks PAs
   verified/rejected.

## Data model

See `supabase/migrations/`:

- `0001_init.sql` — `profiles`, `pa_profiles`, `productions`, `gigs`,
  `dispatches`, `notifications` + RLS policies + the `handle_new_user` trigger
  that creates a `profiles` row on signup.
- `0002_storage.sql` — private `tax-docs` storage bucket + per-user policies.
- `0003_functions.sql` — `dispatch_gig_to_matches`, `accept_dispatch`,
  `decline_dispatch` security-definer functions.
- `0004_disable_tax_residency_gate.sql` — Set-Ready no longer requires a
  verified tax-residency doc, just a passed course (temporary; the
  requirement can be restored by editing the `set_ready` generated column).
- `0005_multi_headcount_and_email.sql` — adds `profiles.email` (so server
  actions can send notification emails without the service-role admin API)
  and fixes `accept_dispatch` to fill a gig only once accepted PAs reach
  `gigs.headcount`, instead of on the first acceptance.

## Setup

1. Create a Supabase project.
2. Run the migrations:
   ```bash
   npm install -g supabase
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   publishable key (Project Settings → API).
4. In the Supabase dashboard, under Authentication → Providers, you can
   disable "Confirm email" for faster local testing.
5. (Optional but recommended) Create a free [Resend](https://resend.com)
   account, grab an API key, and set `RESEND_API_KEY` — this enables real
   email delivery for gig invites and acceptances (`src/lib/email.ts`).
   Without it, those emails are just logged, not sent; the app still works,
   PAs and producers just have to check the in-app notification bell
   (`/notifications`) instead of getting emailed. Resend's shared
   `onboarding@resend.dev` sender works for testing without verifying a
   domain; verify your own domain in Resend before relying on this for
   real productions, for better deliverability.
6. `npm install && npm run dev`

## Roles

Every signup picks a role (`pa` or `producer`); an `admin` role exists for
the vetting queue but has no self-service signup — promote a user by hand:

```sql
update profiles set role = 'admin' where id = '<user-uuid>';
```

## What's intentionally out of scope for this MVP

- **Payroll/payments.** `pa_profiles.payroll_class` and tax-residency status
  are tracked as data only; actual pay runs through your existing payroll
  provider (e.g. Wrapbook) — see the competitive analysis this app was built
  from for why that integration is a "later" step, not a "day one" one.
- **SMS delivery.** Email notifications are wired up (`src/lib/email.ts`,
  via Resend), but SMS push is still a follow-up — it needs a Twilio
  account and per-message cost, and is the natural next step for the "5 AM
  call time" urgency this product is positioned around. The same
  `dispatch_gig_to_matches` / `accept_dispatch` call sites that trigger
  email are the right place to add it.
