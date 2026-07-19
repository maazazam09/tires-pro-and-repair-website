-- Tire Pro & Repair - Supabase Tire Finder Data Setup
-- Run this file in the Supabase SQL editor.
--
-- Purpose:
--   1. Store vehicle Year -> Make -> Model -> Tire Size data in Supabase.
--   2. Seed years 2000 through 2026.
--   3. Provide safe import tables/functions for verified U.S. tire fitment data.
--   4. Store tire products and link them to verified tire sizes for finder results.
--
-- Important data note:
--   This script intentionally does NOT invent full vehicle fitment data. Full verified
--   2000-2026 U.S. year/make/model/tire-size coverage should be imported from a
--   licensed/verified source. Use the staging table below to import that data.
--
-- Public data:
--   Vehicle fitment and tire product data is public catalog data, so RLS policies below
--   allow public read access to active records. Public write access is NOT enabled.

begin;

create extension if not exists pgcrypto;

create or replace function public.tire_finder_normalize(value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(value, ''), '[^A-Za-z0-9]+', '', 'g'));
$$;

create or replace function public.tire_finder_normalize_size(value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(value, ''), '[^A-Za-z0-9]+', '', 'g'));
$$;

create table if not exists public.tire_finder_vehicle_years (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year between 1900 and 2100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tire_finder_vehicle_makes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  normalized_name text generated always as (public.tire_finder_normalize(name)) stored,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tire_finder_vehicle_makes_normalized_name_key unique (normalized_name)
);

create table if not exists public.tire_finder_vehicle_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.tire_finder_vehicle_makes(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  normalized_name text generated always as (public.tire_finder_normalize(name)) stored,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tire_finder_vehicle_models_make_model_key unique (make_id, normalized_name)
);

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

create table if not exists public.tire_finder_tire_sizes (
  id uuid primary key default gen_random_uuid(),
  display_size text not null check (length(trim(display_size)) > 0),
  normalized_size text generated always as (public.tire_finder_normalize_size(display_size)) stored,
  width numeric(6,2),
  aspect_ratio numeric(6,2),
  construction text,
  rim_diameter numeric(6,2),
  prefix text,
  suffix text,
  raw_size text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tire_finder_tire_sizes_normalized_size_key unique (normalized_size),
  constraint tire_finder_tire_sizes_positive_width check (width is null or width > 0),
  constraint tire_finder_tire_sizes_positive_aspect check (aspect_ratio is null or aspect_ratio > 0),
  constraint tire_finder_tire_sizes_positive_rim check (rim_diameter is null or rim_diameter > 0)
);

create table if not exists public.tire_finder_vehicle_fitments (
  id uuid primary key default gen_random_uuid(),
  year_id uuid not null references public.tire_finder_vehicle_years(id) on delete restrict,
  make_id uuid not null references public.tire_finder_vehicle_makes(id) on delete restrict,
  model_id uuid not null references public.tire_finder_vehicle_models(id) on delete restrict,
  trim_name text not null default '',
  normalized_trim text generated always as (public.tire_finder_normalize(trim_name)) stored,
  market text not null default 'US',
  source_name text not null default '',
  source_url text not null default '',
  verified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tire_finder_vehicle_fitments_exact_key unique (year_id, make_id, model_id, normalized_trim, market)
);

create table if not exists public.tire_finder_fitment_sizes (
  id uuid primary key default gen_random_uuid(),
  fitment_id uuid not null references public.tire_finder_vehicle_fitments(id) on delete cascade,
  tire_size_id uuid not null references public.tire_finder_tire_sizes(id) on delete restrict,
  position text not null default 'square' check (position in ('square', 'front', 'rear')),
  created_at timestamptz not null default now(),
  constraint tire_finder_fitment_sizes_exact_key unique (fitment_id, tire_size_id, position)
);

create table if not exists public.tire_finder_products (
  id uuid primary key default gen_random_uuid(),
  external_product_id text,
  name text not null check (length(trim(name)) > 0),
  brand text not null default '',
  model text not null default '',
  sku text not null default '',
  image_url text not null default '',
  secondary_image_url text not null default '',
  description text not null default '',
  season text not null default '',
  load_index text not null default '',
  speed_rating text not null default '',
  service_description text not null default '',
  warranty_miles integer check (warranty_miles is null or warranty_miles >= 0),
  warranty_text text not null default '',
  promotion_available boolean not null default false,
  promotion_text text not null default '',
  video_url text not null default '',
  request_quote_enabled boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tire_finder_product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.tire_finder_products(id) on delete cascade,
  tire_size_id uuid not null references public.tire_finder_tire_sizes(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint tire_finder_product_sizes_exact_key unique (product_id, tire_size_id)
);

create table if not exists public.tires (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (length(trim(brand)) > 0),
  model_name text not null check (length(trim(model_name)) > 0),
  tire_size text not null check (length(trim(tire_size)) > 0),
  image_url text not null default '',
  description text not null default '',
  in_stock boolean not null default true,
  rim_diameter integer,
  created_at timestamptz not null default now(),
  constraint tires_positive_rim_diameter check (rim_diameter is null or rim_diameter > 0)
);

create index if not exists tires_stock_size_idx
  on public.tires(in_stock, tire_size);

create table if not exists public.tire_finder_fitment_import_staging (
  id uuid primary key default gen_random_uuid(),
  import_batch text not null default 'manual',
  year integer not null,
  make text not null,
  model text not null,
  trim_name text not null default '',
  tire_size text not null,
  position text not null default 'square' check (position in ('square', 'front', 'rear')),
  source_name text not null default '',
  source_url text not null default '',
  active boolean not null default true,
  validation_error text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists tire_finder_fitments_lookup_idx
  on public.tire_finder_vehicle_fitments(year_id, make_id, model_id, active);

create index if not exists tire_finder_vehicle_model_years_lookup_idx
  on public.tire_finder_vehicle_model_years(year_id, make_id, active);

create index if not exists tire_finder_products_active_brand_idx
  on public.tire_finder_products(active, brand);

create index if not exists tire_finder_product_sizes_size_idx
  on public.tire_finder_product_sizes(tire_size_id);

insert into public.tire_finder_vehicle_years(year)
select generate_series(2000, 2026)
on conflict (year) do update
set active = true,
    updated_at = now();

create or replace function public.import_tire_finder_fitments(p_import_batch text default 'manual')
returns table (
  rows_seen integer,
  rows_rejected integer,
  makes_upserted integer,
  models_upserted integer,
  sizes_upserted integer,
  fitments_upserted integer,
  size_links_upserted integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows_seen integer := 0;
  v_rows_rejected integer := 0;
  v_count integer := 0;
begin
  select count(*) into v_rows_seen
  from public.tire_finder_fitment_import_staging
  where import_batch = p_import_batch;

  update public.tire_finder_fitment_import_staging
  set validation_error = concat_ws(
    '; ',
    case when year < 2000 or year > 2026 then 'Year must be between 2000 and 2026' end,
    case when length(trim(make)) = 0 then 'Make is required' end,
    case when length(trim(model)) = 0 then 'Model is required' end,
    case when length(trim(tire_size)) = 0 then 'Tire size is required' end,
    case when public.tire_finder_normalize_size(tire_size) !~ '^[A-Z0-9]{5,}$' then 'Tire size format is invalid' end,
    case when position not in ('square', 'front', 'rear') then 'Position must be square, front, or rear' end
  )
  where import_batch = p_import_batch;

  select count(*) into v_rows_rejected
  from public.tire_finder_fitment_import_staging
  where import_batch = p_import_batch
    and validation_error <> '';

  insert into public.tire_finder_vehicle_years(year, active)
  select distinct year, true
  from public.tire_finder_fitment_import_staging
  where import_batch = p_import_batch
    and validation_error = ''
  on conflict (year) do update set active = excluded.active, updated_at = now();

  insert into public.tire_finder_vehicle_makes(name, active)
  select distinct trim(make), true
  from public.tire_finder_fitment_import_staging
  where import_batch = p_import_batch
    and validation_error = ''
  on conflict (normalized_name) do update set name = excluded.name, active = true, updated_at = now();
  get diagnostics v_count = row_count;
  makes_upserted := v_count;

  insert into public.tire_finder_vehicle_models(make_id, name, active)
  select distinct mk.id, trim(s.model), true
  from public.tire_finder_fitment_import_staging s
  join public.tire_finder_vehicle_makes mk
    on mk.normalized_name = public.tire_finder_normalize(s.make)
  where s.import_batch = p_import_batch
    and s.validation_error = ''
  on conflict (make_id, normalized_name) do update set name = excluded.name, active = true, updated_at = now();
  get diagnostics v_count = row_count;
  models_upserted := v_count;

  insert into public.tire_finder_tire_sizes(display_size, raw_size, active)
  select distinct trim(tire_size), trim(tire_size), true
  from public.tire_finder_fitment_import_staging
  where import_batch = p_import_batch
    and validation_error = ''
  on conflict (normalized_size) do update set display_size = excluded.display_size, raw_size = excluded.raw_size, active = true, updated_at = now();
  get diagnostics v_count = row_count;
  sizes_upserted := v_count;

  insert into public.tire_finder_vehicle_fitments(
    year_id,
    make_id,
    model_id,
    trim_name,
    market,
    source_name,
    source_url,
    verified_at,
    active
  )
  select distinct y.id, mk.id, mo.id, trim(s.trim_name), 'US', trim(s.source_name), trim(s.source_url), now(), s.active
  from public.tire_finder_fitment_import_staging s
  join public.tire_finder_vehicle_years y on y.year = s.year
  join public.tire_finder_vehicle_makes mk on mk.normalized_name = public.tire_finder_normalize(s.make)
  join public.tire_finder_vehicle_models mo
    on mo.make_id = mk.id
   and mo.normalized_name = public.tire_finder_normalize(s.model)
  where s.import_batch = p_import_batch
    and s.validation_error = ''
  on conflict (year_id, make_id, model_id, normalized_trim, market)
  do update set
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    verified_at = excluded.verified_at,
    active = excluded.active,
    updated_at = now();
  get diagnostics v_count = row_count;
  fitments_upserted := v_count;

  insert into public.tire_finder_vehicle_model_years(
    year_id,
    make_id,
    model_id,
    source_name,
    source_url,
    active
  )
  select distinct y.id, mk.id, mo.id, trim(s.source_name), trim(s.source_url), true
  from public.tire_finder_fitment_import_staging s
  join public.tire_finder_vehicle_years y on y.year = s.year
  join public.tire_finder_vehicle_makes mk on mk.normalized_name = public.tire_finder_normalize(s.make)
  join public.tire_finder_vehicle_models mo
    on mo.make_id = mk.id
   and mo.normalized_name = public.tire_finder_normalize(s.model)
  where s.import_batch = p_import_batch
    and s.validation_error = ''
  on conflict (year_id, make_id, model_id)
  do update set
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    active = true,
    updated_at = now();

  insert into public.tire_finder_fitment_sizes(fitment_id, tire_size_id, position)
  select distinct vf.id, ts.id, s.position
  from public.tire_finder_fitment_import_staging s
  join public.tire_finder_vehicle_years y on y.year = s.year
  join public.tire_finder_vehicle_makes mk on mk.normalized_name = public.tire_finder_normalize(s.make)
  join public.tire_finder_vehicle_models mo
    on mo.make_id = mk.id
   and mo.normalized_name = public.tire_finder_normalize(s.model)
  join public.tire_finder_vehicle_fitments vf
    on vf.year_id = y.id
   and vf.make_id = mk.id
   and vf.model_id = mo.id
   and vf.normalized_trim = public.tire_finder_normalize(s.trim_name)
   and vf.market = 'US'
  join public.tire_finder_tire_sizes ts
    on ts.normalized_size = public.tire_finder_normalize_size(s.tire_size)
  where s.import_batch = p_import_batch
    and s.validation_error = ''
  on conflict (fitment_id, tire_size_id, position) do nothing;
  get diagnostics v_count = row_count;
  size_links_upserted := v_count;

  rows_seen := v_rows_seen;
  rows_rejected := v_rows_rejected;
  return next;
end;
$$;

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

create or replace function public.tire_finder_sizes(p_year integer, p_make text, p_model text)
returns table(value text, label text, tire_position text)
language sql
stable
as $$
  select distinct ts.normalized_size as value, ts.display_size as label, fs.position as tire_position
  from public.tire_finder_vehicle_fitments vf
  join public.tire_finder_vehicle_years y on y.id = vf.year_id
  join public.tire_finder_vehicle_makes mk on mk.id = vf.make_id
  join public.tire_finder_vehicle_models mo on mo.id = vf.model_id
  join public.tire_finder_fitment_sizes fs on fs.fitment_id = vf.id
  join public.tire_finder_tire_sizes ts on ts.id = fs.tire_size_id
  where y.year = p_year
    and mk.normalized_name = public.tire_finder_normalize(p_make)
    and mo.normalized_name = public.tire_finder_normalize(p_model)
    and y.active = true
    and mk.active = true
    and mo.active = true
    and vf.active = true
    and ts.active = true
  order by ts.display_size, fs.position;
$$;

create or replace function public.tire_finder_matching_products(p_size text)
returns table(
  id uuid,
  name text,
  brand text,
  model text,
  sku text,
  image_url text,
  description text,
  season text,
  warranty_miles integer,
  warranty_text text,
  service_description text,
  promotion_available boolean,
  promotion_text text,
  video_url text,
  request_quote_enabled boolean
)
language sql
stable
as $$
  select p.id,
         p.name,
         p.brand,
         p.model,
         p.sku,
         p.image_url,
         p.description,
         p.season,
         p.warranty_miles,
         p.warranty_text,
         p.service_description,
         p.promotion_available,
         p.promotion_text,
         p.video_url,
         p.request_quote_enabled
  from public.tire_finder_products p
  join public.tire_finder_product_sizes ps on ps.product_id = p.id
  join public.tire_finder_tire_sizes ts on ts.id = ps.tire_size_id
  where p.active = true
    and ts.active = true
    and ts.normalized_size = public.tire_finder_normalize_size(p_size)
  order by p.brand, p.model, p.name;
$$;

alter table public.tire_finder_vehicle_years enable row level security;
alter table public.tire_finder_vehicle_makes enable row level security;
alter table public.tire_finder_vehicle_models enable row level security;
alter table public.tire_finder_vehicle_model_years enable row level security;
alter table public.tire_finder_tire_sizes enable row level security;
alter table public.tire_finder_vehicle_fitments enable row level security;
alter table public.tire_finder_fitment_sizes enable row level security;
alter table public.tire_finder_products enable row level security;
alter table public.tire_finder_product_sizes enable row level security;
alter table public.tires enable row level security;
alter table public.tire_finder_fitment_import_staging enable row level security;

drop policy if exists "Public read tire finder years" on public.tire_finder_vehicle_years;
create policy "Public read tire finder years"
on public.tire_finder_vehicle_years
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public read tire finder makes" on public.tire_finder_vehicle_makes;
create policy "Public read tire finder makes"
on public.tire_finder_vehicle_makes
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public read tire finder models" on public.tire_finder_vehicle_models;
create policy "Public read tire finder models"
on public.tire_finder_vehicle_models
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public read tire finder model years" on public.tire_finder_vehicle_model_years;
create policy "Public read tire finder model years"
on public.tire_finder_vehicle_model_years
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public read tire finder sizes" on public.tire_finder_tire_sizes;
create policy "Public read tire finder sizes"
on public.tire_finder_tire_sizes
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public read active tire finder fitments" on public.tire_finder_vehicle_fitments;
create policy "Public read active tire finder fitments"
on public.tire_finder_vehicle_fitments
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public read tire finder fitment sizes" on public.tire_finder_fitment_sizes;
create policy "Public read tire finder fitment sizes"
on public.tire_finder_fitment_sizes
for select
to anon, authenticated
using (true);

drop policy if exists "Public read active tire finder products" on public.tire_finder_products;
create policy "Public read active tire finder products"
on public.tire_finder_products
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public read tire finder product sizes" on public.tire_finder_product_sizes;
create policy "Public read tire finder product sizes"
on public.tire_finder_product_sizes
for select
to anon, authenticated
using (true);

drop policy if exists "Public read in-stock tires" on public.tires;
create policy "Public read in-stock tires"
on public.tires
for select
to anon, authenticated
using (in_stock = true);

-- No public write policies are created. Use Supabase service role from your
-- Next.js API routes or Supabase dashboard SQL editor for imports/admin writes.

commit;

-- ==================================================
-- IMPORT INSTRUCTIONS
-- ==================================================
--
-- 1. Import verified fitment CSV rows into:
--      public.tire_finder_fitment_import_staging
--
--    Required CSV columns:
--      import_batch, year, make, model, trim_name, tire_size, position, source_name, source_url, active
--
--    position values:
--      square  = normal same-size fitment
--      front   = front tire in staggered fitment
--      rear    = rear tire in staggered fitment
--
-- 2. Preview invalid rows before importing:
--
--    select *
--    from public.tire_finder_fitment_import_staging
--    where import_batch = 'your-batch-name';
--
-- 3. Upsert verified rows:
--
--    select *
--    from public.import_tire_finder_fitments('your-batch-name');
--
-- 4. Check finder dropdown data:
--
--    select * from public.tire_finder_available_years;
--    select * from public.tire_finder_makes(2020);
--    select * from public.tire_finder_models(2020, 'Toyota');
--    select * from public.tire_finder_sizes(2020, 'Toyota', 'Camry');
--
-- 5. Link real tire products to sizes by inserting into:
--      public.tire_finder_products
--      public.tire_finder_product_sizes
--    Or use the simpler public.tires table expected by the current website
--    integration:
--
--    insert into public.tires
--      (brand, model_name, tire_size, image_url, description, in_stock, rim_diameter)
--    values
--      ('Michelin', 'Defender2', '215/55R17', 'https://example.com/tire.jpg', 'All-season touring tire.', true, 17);
--
--    Product results only appear when the product is active and linked to the
--    exact normalized tire size selected by the customer.
--
-- ==================================================
-- MANUAL DATA EXAMPLE
-- ==================================================
--
-- Use this pattern when you want to add verified data manually.
-- Change the values to the exact vehicle and tire-size data you have verified.
--
-- insert into public.tire_finder_fitment_import_staging
--   (import_batch, year, make, model, trim_name, tire_size, position, source_name, source_url, active)
-- values
--   ('manual-verified-001', 2020, 'Toyota', 'Camry', '', '215/55R17', 'square', 'Manual verified source', '', true),
--   ('manual-verified-001', 2020, 'Toyota', 'Camry', '', '235/45R18', 'square', 'Manual verified source', '', true);
--
-- select *
-- from public.import_tire_finder_fitments('manual-verified-001');
--
-- select *
-- from public.tire_finder_sizes(2020, 'Toyota', 'Camry');
