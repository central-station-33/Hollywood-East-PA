-- Producer-facing gig management: manually invite a specific Set-Ready PA
-- (bypassing the state/role auto-match), cancel a gig, and notify already-
-- accepted PAs when gig details change. All security-definer, same pattern
-- as dispatch_gig_to_matches/accept_dispatch: producers don't get broad
-- INSERT/UPDATE rights on dispatches or notifications directly, these
-- functions check ownership internally instead.

create function public.invite_pa_to_gig(p_gig_id uuid, p_pa_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_gig record;
  v_pa record;
begin
  select * into v_gig from public.gigs where id = p_gig_id;

  if v_gig is null or v_gig.producer_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if v_gig.status <> 'open' then
    raise exception 'This gig is no longer open';
  end if;

  select * into v_pa from public.pa_profiles where profile_id = p_pa_id;

  if v_pa is null or v_pa.set_ready is not true then
    raise exception 'PA is not Set-Ready';
  end if;

  insert into public.dispatches (gig_id, pa_id, status)
  values (p_gig_id, p_pa_id, 'invited')
  on conflict (gig_id, pa_id) do nothing;

  if not found then
    raise exception 'This PA has already been dispatched for this gig';
  end if;

  insert into public.notifications (recipient_id, gig_id, message)
  values (p_pa_id, p_gig_id, 'New gig invite: ' || v_gig.title || ' (' || v_gig.location_state || ')');
end;
$$;

create function public.notify_accepted_pas(p_gig_id uuid, p_message text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_gig record;
begin
  select * into v_gig from public.gigs where id = p_gig_id;

  if v_gig is null or v_gig.producer_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  insert into public.notifications (recipient_id, gig_id, message)
  select d.pa_id, p_gig_id, p_message
  from public.dispatches d
  where d.gig_id = p_gig_id and d.status in ('accepted', 'confirmed');
end;
$$;

create function public.cancel_gig(p_gig_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_gig record;
begin
  select * into v_gig from public.gigs where id = p_gig_id for update;

  if v_gig is null or v_gig.producer_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if v_gig.status = 'cancelled' then
    raise exception 'This gig is already cancelled';
  end if;

  update public.gigs set status = 'cancelled' where id = p_gig_id;

  update public.dispatches
  set status = 'expired', responded_at = now()
  where gig_id = p_gig_id and status = 'invited';

  insert into public.notifications (recipient_id, gig_id, message)
  select d.pa_id, p_gig_id, 'Cancelled: ' || v_gig.title
  from public.dispatches d
  where d.gig_id = p_gig_id and d.status in ('accepted', 'confirmed');
end;
$$;
