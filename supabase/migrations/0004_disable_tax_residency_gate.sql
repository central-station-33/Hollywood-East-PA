-- Temporarily disable the tax-residency-verification requirement for
-- Set-Ready status: a passed micro-course is now sufficient. Tax residency
-- upload/admin-verification stays in place, just no longer gates dispatch
-- eligibility. Re-add the "verified" clause to set_ready's expression below
-- to restore the requirement later.

-- The gigs policy has a dependency on pa_profiles.set_ready, so it has to
-- be dropped before the generated column can be dropped and re-added
-- (Postgres has no ALTER COLUMN ... SET EXPRESSION for generated columns).
drop policy "set-ready PAs and admins can view open gigs" on public.gigs;

alter table public.pa_profiles drop column set_ready;

alter table public.pa_profiles add column set_ready boolean generated always as (
  course_completed_at is not null
) stored;

create policy "set-ready PAs and admins can view open gigs"
  on public.gigs for select
  to authenticated
  using (
    producer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.pa_profiles pa
      where pa.profile_id = auth.uid() and pa.set_ready = true
    )
  );
