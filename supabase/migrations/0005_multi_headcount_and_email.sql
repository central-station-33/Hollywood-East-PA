-- 1. Store a copy of the user's email on public.profiles. auth.users isn't
-- exposed through the API layer, so this lets server actions look up a
-- recipient's email (for notification sending) via a normal authenticated
-- query instead of needing the service-role admin API.
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

alter table public.profiles alter column email set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'pa'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  return new;
end;
$$;

-- 2. accept_dispatch previously filled the gig (and expired every other
-- invite) on the FIRST acceptance, ignoring gigs.headcount. Make it count
-- accepted dispatches and only fill once headcount is reached, so a gig
-- needing 3 PAs actually collects 3 acceptances.
--
-- Also guards against a double-submit/retry of the same accept call: the
-- accept UPDATE is now conditioned on status = 'invited' (a compare-and-swap)
-- with `if not found` raising, instead of trusting an earlier in-memory
-- status check that a concurrent call on the same dispatch could race past.
create or replace function public.accept_dispatch(p_dispatch_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_dispatch record;
  v_gig record;
  v_pa_name text;
  v_accepted_count int;
begin
  select * into v_dispatch from public.dispatches where id = p_dispatch_id;

  if v_dispatch is null or v_dispatch.pa_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  -- Locks the gig row so concurrent accepts on the same gig serialize —
  -- each waiting call re-reads the post-commit gig status once unblocked,
  -- rather than acting on a stale in-memory read.
  select * into v_gig from public.gigs where id = v_dispatch.gig_id for update;

  if v_gig.status <> 'open' then
    raise exception 'This gig is no longer available';
  end if;

  update public.dispatches
  set status = 'accepted', responded_at = now()
  where id = p_dispatch_id and status = 'invited';

  if not found then
    raise exception 'This invite is no longer active';
  end if;

  select count(*) into v_accepted_count
  from public.dispatches
  where gig_id = v_gig.id and status in ('accepted', 'confirmed');

  if v_accepted_count >= v_gig.headcount then
    update public.gigs set status = 'filled' where id = v_gig.id;

    update public.dispatches
    set status = 'expired', responded_at = now()
    where gig_id = v_gig.id and status = 'invited';
  end if;

  select full_name into v_pa_name from public.profiles where id = auth.uid();

  insert into public.notifications (recipient_id, gig_id, message)
  values (
    v_gig.producer_id,
    v_gig.id,
    coalesce(v_pa_name, 'A PA') || ' accepted ' || v_gig.title
      || ' (' || v_accepted_count || '/' || v_gig.headcount || ' filled)'
  );
end;
$$;
