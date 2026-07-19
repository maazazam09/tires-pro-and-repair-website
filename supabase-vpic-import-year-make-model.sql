-- Tire Pro & Repair - Import NHTSA vPIC Year/Make/Model Data
--
-- Run this AFTER:
--   1. supabase-tire-finder-fitments.sql has been run successfully.
--   2. The NHTSA vPIC backup has been restored into your Supabase database
--      with schema name: vpic
--
-- This imports ONLY Year -> Make -> Model data.
-- NHTSA vPIC does not include tire sizes, so tire sizes still need to be added
-- manually or from a verified tire fitment source.

begin;

create table if not exists public.tire_finder_vehicle_model_years (
  id uuid primary key default gen_random_uuid(),
  year_id uuid not null references public.tire_finder_vehicle_years(id) on delete cascade,
  make_id uuid not null references public.tire_finder_vehicle_makes(id) on delete cascade,
  model_id uuid not null references public.tire_finder_vehicle_models(id) on delete cascade,
  source_name text not null default '',
  source_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tire_finder_vehicle_model_years_exact_key unique (year_id, make_id, model_id)
);

create index if not exists tire_finder_vehicle_model_years_lookup_idx
  on public.tire_finder_vehicle_model_years(year_id, make_id, active);

insert into public.tire_finder_vehicle_years(year, active)
select generate_series(2000, 2026), true
on conflict (year) do update
set active = true,
    updated_at = now();

insert into public.tire_finder_vehicle_makes(name, active)
select distinct trim(mk.name), true
from vpic.vehiclespecschema vs
join vpic.vehiclespecschema_year vsy on vsy.vehiclespecschemaid = vs.id
join vpic.make mk on mk.id = vs.makeid
where vsy.year between 2000 and 2026
  and trim(mk.name) <> ''
on conflict (normalized_name) do update
set name = excluded.name,
    active = true,
    updated_at = now();

insert into public.tire_finder_vehicle_models(make_id, name, active)
select distinct tfm.id, trim(mo.name), true
from vpic.vehiclespecschema vs
join vpic.vehiclespecschema_year vsy on vsy.vehiclespecschemaid = vs.id
join vpic.vehiclespecschema_model vsm on vsm.vehiclespecschemaid = vs.id
join vpic.make mk on mk.id = vs.makeid
join vpic.model mo on mo.id = vsm.modelid
join public.tire_finder_vehicle_makes tfm
  on tfm.normalized_name = public.tire_finder_normalize(mk.name)
where vsy.year between 2000 and 2026
  and trim(mk.name) <> ''
  and trim(mo.name) <> ''
on conflict (make_id, normalized_name) do update
set name = excluded.name,
    active = true,
    updated_at = now();

insert into public.tire_finder_vehicle_model_years(
  year_id,
  make_id,
  model_id,
  source_name,
  source_url,
  active
)
select distinct y.id, tfm.id, tfmo.id,
       'NHTSA vPIC Lite 2026-07',
       'https://vpic.nhtsa.dot.gov/downloads/',
       true
from vpic.vehiclespecschema vs
join vpic.vehiclespecschema_year vsy on vsy.vehiclespecschemaid = vs.id
join vpic.vehiclespecschema_model vsm on vsm.vehiclespecschemaid = vs.id
join vpic.make mk on mk.id = vs.makeid
join vpic.model mo on mo.id = vsm.modelid
join public.tire_finder_vehicle_years y on y.year = vsy.year
join public.tire_finder_vehicle_makes tfm
  on tfm.normalized_name = public.tire_finder_normalize(mk.name)
join public.tire_finder_vehicle_models tfmo
  on tfmo.make_id = tfm.id
 and tfmo.normalized_name = public.tire_finder_normalize(mo.name)
where vsy.year between 2000 and 2026
  and trim(mk.name) <> ''
  and trim(mo.name) <> ''
on conflict (year_id, make_id, model_id) do update
set source_name = excluded.source_name,
    source_url = excluded.source_url,
    active = true,
    updated_at = now();

alter table public.tire_finder_vehicle_model_years enable row level security;

drop policy if exists "Public read tire finder model years" on public.tire_finder_vehicle_model_years;
create policy "Public read tire finder model years"
on public.tire_finder_vehicle_model_years
for select
to anon, authenticated
using (active = true);

create or replace view public.tire_finder_available_years as
select distinct y.year
from public.tire_finder_vehicle_years y
where y.year between 2000 and 2026
  and y.active = true
order by y.year desc;

create or replace function public.tire_finder_makes(p_year integer)
returns table(make text)
language sql
stable
as $$
  select distinct mk.name
  from public.tire_finder_vehicle_model_years vmy
  join public.tire_finder_vehicle_years y on y.id = vmy.year_id
  join public.tire_finder_vehicle_makes mk on mk.id = vmy.make_id
  where y.year = p_year
    and y.active = true
    and mk.active = true
    and vmy.active = true
  order by mk.name;
$$;

create or replace function public.tire_finder_models(p_year integer, p_make text)
returns table(model text)
language sql
stable
as $$
  select distinct mo.name
  from public.tire_finder_vehicle_model_years vmy
  join public.tire_finder_vehicle_years y on y.id = vmy.year_id
  join public.tire_finder_vehicle_makes mk on mk.id = vmy.make_id
  join public.tire_finder_vehicle_models mo on mo.id = vmy.model_id
  where y.year = p_year
    and mk.normalized_name = public.tire_finder_normalize(p_make)
    and y.active = true
    and mk.active = true
    and mo.active = true
    and vmy.active = true
  order by mo.name;
$$;

commit;

-- Verification queries:
--
-- select count(*) as years from public.tire_finder_vehicle_years;
-- select count(*) as makes from public.tire_finder_vehicle_makes;
-- select count(*) as models from public.tire_finder_vehicle_models;
-- select count(*) as year_make_models from public.tire_finder_vehicle_model_years;
-- select * from public.tire_finder_makes(2020) limit 25;
-- select * from public.tire_finder_models(2020, 'Toyota') limit 25;
