-- Tire Pro & Repair - Supabase Tire Inventory Table
-- Run this in Supabase SQL editor if you already ran the main tire finder SQL.

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

alter table public.tires enable row level security;

drop policy if exists "Public read in-stock tires" on public.tires;
create policy "Public read in-stock tires"
on public.tires
for select
to anon, authenticated
using (in_stock = true);

-- Example inventory row. Replace with real tire data before using.
--
-- insert into public.tires
--   (brand, model_name, tire_size, image_url, description, in_stock, rim_diameter)
-- values
--   ('Michelin', 'Defender2', '215/55R17', 'https://example.com/tire.jpg', 'All-season touring tire.', true, 17);
