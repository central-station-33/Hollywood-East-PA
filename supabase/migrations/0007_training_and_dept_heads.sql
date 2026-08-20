-- Training pipeline: PA -> department training -> dept-head endorsement -> union path.
-- Adds a dept_head role, a public curriculum (departments/training_modules), PA
-- self-tracked progress, verified dept-head profiles, and endorsements issued by
-- verified dept heads. Same security-definer pattern as dispatch/gig functions:
-- privileged writes (endorsements) go through a function that checks authorization
-- internally rather than a broad RLS insert policy.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('pa', 'producer', 'admin', 'dept_head'));

-- ---------------------------------------------------------------------------
-- departments: fixed curriculum catalog, publicly readable (marketing page)
-- ---------------------------------------------------------------------------
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  union_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.departments enable row level security;

create policy "departments are publicly viewable"
  on public.departments for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- training_modules: curriculum steps within a department, publicly readable
-- ---------------------------------------------------------------------------
create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  title text not null,
  description text not null,
  skills text[] not null default '{}',
  estimated_hours numeric(4, 1),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.training_modules enable row level security;

create policy "training_modules are publicly viewable"
  on public.training_modules for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- pa_module_progress: self-reported completion, one row per PA per module
-- ---------------------------------------------------------------------------
create table public.pa_module_progress (
  pa_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid not null references public.training_modules (id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (pa_id, module_id)
);

alter table public.pa_module_progress enable row level security;

create policy "pa manages own module progress"
  on public.pa_module_progress for all
  to authenticated
  using (pa_id = auth.uid())
  with check (pa_id = auth.uid());

create policy "dept_heads and admins can view module progress"
  on public.pa_module_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('dept_head', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- dept_head_profiles: vetting for dept heads, mirrors pa_profiles pattern
-- ---------------------------------------------------------------------------
create table public.dept_head_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  department_id uuid references public.departments (id) on delete set null,
  title text,
  company text,
  union_affiliation text,
  bio text,
  verified boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dept_head_profiles enable row level security;

-- Deliberately no INSERT/UPDATE policy for the dept head themselves: `verified`
-- gates who can issue endorsements, so self-service writes go through
-- upsert_dept_head_profile() below, which never touches verified/admin_notes.
-- (Same reasoning as why gigs/dispatches route privileged writes through
-- functions instead of a broad "own row" RLS policy.)
create policy "dept_head can view own profile"
  on public.dept_head_profiles for select
  to authenticated
  using (profile_id = auth.uid());

create policy "authenticated can view verified dept_head profiles"
  on public.dept_head_profiles for select
  to authenticated
  using (verified = true);

create policy "admins can view all dept_head_profiles"
  on public.dept_head_profiles for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins can update any dept_head_profile"
  on public.dept_head_profiles for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- endorsements: a verified dept head vouching for a PA within their department
-- ---------------------------------------------------------------------------
create table public.endorsements (
  id uuid primary key default gen_random_uuid(),
  pa_id uuid not null references public.profiles (id) on delete cascade,
  dept_head_id uuid not null references public.profiles (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (pa_id, dept_head_id, department_id)
);

alter table public.endorsements enable row level security;

create policy "authenticated can view endorsements"
  on public.endorsements for select
  to authenticated
  using (true);

create index pa_module_progress_module_idx on public.pa_module_progress (module_id);
create index endorsements_pa_idx on public.endorsements (pa_id);
create index training_modules_dept_idx on public.training_modules (department_id, sort_order);

-- ---------------------------------------------------------------------------
-- issue_endorsement: only a verified dept head, within their own department,
-- can endorse a PA. No direct INSERT policy on endorsements — this function
-- is the only write path.
-- ---------------------------------------------------------------------------
create function public.issue_endorsement(p_pa_id uuid, p_department_id uuid, p_note text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_dept_head record;
  v_dept_name text;
begin
  select * into v_dept_head from public.dept_head_profiles where profile_id = auth.uid();

  if v_dept_head is null or v_dept_head.verified is not true then
    raise exception 'Only verified department heads can issue endorsements';
  end if;

  if v_dept_head.department_id is null or v_dept_head.department_id <> p_department_id then
    raise exception 'You can only endorse within your own department';
  end if;

  select name into v_dept_name from public.departments where id = p_department_id;

  insert into public.endorsements (pa_id, dept_head_id, department_id, note)
  values (p_pa_id, auth.uid(), p_department_id, nullif(p_note, ''))
  on conflict (pa_id, dept_head_id, department_id) do update set note = excluded.note;

  insert into public.notifications (recipient_id, message)
  values (
    p_pa_id,
    'You''ve been endorsed for ' || coalesce(v_dept_name, 'a department') ||
      ' by a verified department head — you''re on the path toward union readiness.'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- upsert_dept_head_profile: the only write path to dept_head_profiles for the
-- dept head themselves. Only ever touches non-sensitive fields, so there is
-- no way for a dept head to set their own `verified` flag.
-- ---------------------------------------------------------------------------
create function public.upsert_dept_head_profile(
  p_department_id uuid, p_title text, p_company text, p_union_affiliation text, p_bio text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.dept_head_profiles (profile_id, department_id, title, company, union_affiliation, bio)
  values (auth.uid(), p_department_id, p_title, p_company, p_union_affiliation, p_bio)
  on conflict (profile_id) do update set
    department_id = excluded.department_id,
    title = excluded.title,
    company = excluded.company,
    union_affiliation = excluded.union_affiliation,
    bio = excluded.bio,
    updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Seed curriculum: 8 departments x 3 modules each
-- ---------------------------------------------------------------------------
insert into public.departments (slug, name, description, union_path, sort_order) values
  ('locations', 'Locations', 'Scouting, permitting, and the relationships that keep a production legal and welcome everywhere it shoots.', 'IATSE Local 161 — Location Managers Guild', 1),
  ('art', 'Art Department', 'Building and dressing the world on screen, from art department paperwork to set dressing on the day.', 'IATSE Local 800 / 876 — Art Directors & Set Decorators', 2),
  ('costume', 'Costume Department', 'Continuity, fittings, and wardrobe prep that keeps a cast camera-ready take after take.', 'IATSE Local 892 — Costume Designers Guild', 3),
  ('camera', 'Camera Department', 'Loading, data management, and set etiquette on a working camera crew.', 'IATSE Local 600 — International Cinematographers Guild', 4),
  ('grip_electric', 'Grip & Electric', 'Rigging, lighting support, and the safety discipline of a lighting/grip package.', 'IATSE Local 52 / Local 490 — Grips & Studio Mechanics', 5),
  ('production_office', 'Production Office', 'Running the paper trail — scheduling, contracts, and the coordination that keeps a show on track.', 'DGA — Assistant Director / UPM track', 6),
  ('transportation', 'Transportation', 'Fleet logistics and driving operations that move a production safely from location to location.', 'Teamsters Local 817', 7),
  ('ad_department', 'Assistant Directing', 'Running set — schedules, breakdowns, and the calm authority of a strong 2nd AD.', 'DGA Trainee Program', 8);

insert into public.training_modules (department_id, title, description, skills, estimated_hours, sort_order)
select d.id, m.title, m.description, m.skills, m.estimated_hours, m.sort_order
from (values
  ('locations', 'Foundations', 'The basics of how a locations department operates on a production.', array['Read a location agreement', 'Understand parking & basecamp logistics', 'Know NY/NJ film permit basics'], 4.0, 1),
  ('locations', 'Hands-On Practicum', 'Shadowing real location work on an active or simulated shoot day.', array['Run a location lockup', 'Manage neighbor/community relations', 'Coordinate with police/fire for closures'], 8.0, 2),
  ('locations', 'Dept-Head Shadow & Readiness', 'Direct shadowing of a Location Manager, capped with a readiness review.', array['Scout and pitch a location', 'Draft a location agreement', 'Run a full tech scout'], 12.0, 3),

  ('art', 'Foundations', 'How the art department is structured and how it interfaces with other departments.', array['Read an art department schedule', 'Understand set dressing vs. props', 'Basic tool & material safety'], 4.0, 1),
  ('art', 'Hands-On Practicum', 'Working set dressing and art department wrap/strike on real days.', array['Dress and strike a set', 'Maintain continuity photos', 'Source materials on a budget'], 8.0, 2),
  ('art', 'Dept-Head Shadow & Readiness', 'Shadowing an Art Director or Set Decorator through prep and shoot.', array['Build a prep schedule', 'Manage a swing gang', 'Present a set concept'], 12.0, 3),

  ('costume', 'Foundations', 'Wardrobe department basics and how continuity is tracked.', array['Understand costume continuity logs', 'Basic garment care & steaming', 'Fitting-room etiquette'], 4.0, 1),
  ('costume', 'Hands-On Practicum', 'On-set wardrobe support across a shoot day.', array['Run a background costume check', 'Manage a set costumer bag', 'Track multiples & doubles'], 8.0, 2),
  ('costume', 'Dept-Head Shadow & Readiness', 'Shadowing a Key Costumer or Costume Designer.', array['Build a costume breakdown', 'Run a fitting session', 'Manage a rental/build budget'], 12.0, 3),

  ('camera', 'Foundations', 'Camera department roles and on-set etiquette.', array['Camera package basics', 'Set safety around moving equipment', 'Slating & camera reports'], 4.0, 1),
  ('camera', 'Hands-On Practicum', 'Working alongside camera crew on real or simulated setups.', array['Assist a data wrangler', 'Support camera prep/wrap', 'Basic lens & filter handling'], 8.0, 2),
  ('camera', 'Dept-Head Shadow & Readiness', 'Shadowing a DIT or 1st AC through a full shoot day.', array['Pull focus basics', 'Manage a camera cart', 'Run camera prep checklist'], 12.0, 3),

  ('grip_electric', 'Foundations', 'Grip/electric safety fundamentals and terminology.', array['Cable & rigging safety', 'Basic lighting terminology', 'PPE and set safety protocol'], 4.0, 1),
  ('grip_electric', 'Hands-On Practicum', 'Supporting a working lighting/grip package.', array['Assist a rigging call', 'Set flags, nets & diffusion', 'Run cable safely on a live set'], 8.0, 2),
  ('grip_electric', 'Dept-Head Shadow & Readiness', 'Shadowing a Gaffer or Key Grip through prep and shoot.', array['Read a lighting plot', 'Build a genny/power plan', 'Lead a small rigging crew'], 12.0, 3),

  ('production_office', 'Foundations', 'Production office structure and core paperwork.', array['Read a one-line schedule', 'Understand call sheet construction', 'Basic contracts & deal memos'], 4.0, 1),
  ('production_office', 'Hands-On Practicum', 'Running real production office workflows.', array['Build a call sheet', 'Track crew paperwork & onboarding', 'Coordinate travel & housing'], 8.0, 2),
  ('production_office', 'Dept-Head Shadow & Readiness', 'Shadowing a UPM or Production Coordinator.', array['Build a production schedule', 'Manage a department budget tracker', 'Run a production meeting'], 12.0, 3),

  ('transportation', 'Foundations', 'Fleet basics and driving operations on a production.', array['DOT/vehicle safety basics', 'Basecamp & unit logistics', 'Route planning fundamentals'], 4.0, 1),
  ('transportation', 'Hands-On Practicum', 'Supporting real transportation operations.', array['Coordinate a picture-car move', 'Manage a basecamp layout', 'Track driver hours & logs'], 8.0, 2),
  ('transportation', 'Dept-Head Shadow & Readiness', 'Shadowing a Transportation Captain.', array['Build a transportation plan', 'Manage a driver roster', 'Coordinate multi-location moves'], 12.0, 3),

  ('ad_department', 'Foundations', 'The AD department''s role in running a set.', array['Read a stripboard/schedule', 'Understand background/extras basics', 'Radio & set communication protocol'], 4.0, 1),
  ('ad_department', 'Hands-On Practicum', 'Running real set operations under supervision.', array['Run background through a scene', 'Track a shooting schedule live', 'Manage a lockup & set safety'], 8.0, 2),
  ('ad_department', 'Dept-Head Shadow & Readiness', 'Shadowing a 2nd AD or 1st AD through prep and shoot.', array['Build a full-day schedule', 'Run a company move', 'Lead a background call'], 12.0, 3)
) as m(slug, title, description, skills, estimated_hours, sort_order)
join public.departments d on d.slug = m.slug;
