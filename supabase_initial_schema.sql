create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'staff' check (role in ('admin','staff')),
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  language text not null default 'bm' check (language in ('bm','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_credentials (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and status = 'active') $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active') $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare first_user boolean;
begin
  select not exists(select 1 from public.profiles) into first_user;
  insert into public.profiles(id, full_name, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when first_user then 'admin' else 'staff' end,
    case when first_user then 'active' else 'pending' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.set_my_pin(p_pin text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_active_user() then raise exception 'Account is not active'; end if;
  if p_pin !~ '^\\d{4,6}$' then raise exception 'PIN must contain 4 to 6 digits'; end if;
  insert into public.staff_credentials(user_id, pin_hash, updated_at)
  values (auth.uid(), extensions.crypt(p_pin, extensions.gen_salt('bf')), now())
  on conflict (user_id) do update set pin_hash = excluded.pin_hash, updated_at = now();
end;
$$;

create or replace function public.verify_my_pin(p_pin text)
returns boolean language sql security definer set search_path = public
as $$
  select coalesce((select pin_hash = extensions.crypt(p_pin, pin_hash) from public.staff_credentials where user_id = auth.uid()), false)
$$;

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_bm text not null,
  name_en text not null,
  category text not null check (category in ('compressor','genset')),
  service_interval_days integer not null check (service_interval_days > 0),
  last_service date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  category text not null,
  name_bm text not null,
  name_en text not null,
  variant text,
  item_condition text not null default 'in_service' check (item_condition in ('new','in_service','old','repair','retired')),
  quantity integer not null default 0 check (quantity >= 0),
  unit text not null default 'unit',
  reorder_level integer not null default 0 check (reorder_level >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.asset_units (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  asset_type text not null check (asset_type in ('tank','regulator','other')),
  serial_no text,
  tag_no text,
  brand text,
  date_in_service date,
  hydro_date date,
  status text not null default 'active' check (status in ('active','repair','retired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(asset_type, serial_no)
);

create sequence public.job_number_seq start 1;
create or replace function public.next_job_number()
returns text language sql volatile set search_path = public
as $$ select 'JOB-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.job_number_seq')::text, 5, '0') $$;

create table public.service_jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text not null unique default public.next_job_number(),
  equipment_id uuid references public.equipment(id) on delete set null,
  asset_unit_id uuid references public.asset_units(id) on delete set null,
  job_type text not null,
  service_date date not null default current_date,
  running_hours numeric(12,1),
  fault text,
  work_done text not null,
  hydro_date date,
  cost numeric(12,2) check (cost is null or cost >= 0),
  remarks text,
  photo_paths text[] not null default '{}',
  signature_path text,
  verification_method text not null check (verification_method in ('signature','pin')),
  status text not null default 'submitted' check (status in ('draft','submitted','cancelled')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (equipment_id is not null or asset_unit_id is not null)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out','adjustment')),
  quantity integer not null check (quantity > 0),
  reason text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.update_equipment_service_date()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'submitted' and new.equipment_id is not null then
    update public.equipment set last_service = new.service_date, updated_at = now()
    where id = new.equipment_id and (last_service is null or last_service <= new.service_date);
  end if;
  return new;
end;
$$;
create trigger service_job_updates_equipment after insert or update of status, service_date
on public.service_jobs for each row execute function public.update_equipment_service_date();

alter table public.profiles enable row level security;
alter table public.staff_credentials enable row level security;
alter table public.equipment enable row level security;
alter table public.inventory_items enable row level security;
alter table public.asset_units enable row level security;
alter table public.service_jobs enable row level security;
alter table public.stock_movements enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy equipment_read on public.equipment for select to authenticated using (public.is_active_user());
create policy equipment_admin_insert on public.equipment for insert to authenticated with check (public.is_admin());
create policy equipment_admin_update on public.equipment for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy equipment_admin_delete on public.equipment for delete to authenticated using (public.is_admin());

create policy inventory_read on public.inventory_items for select to authenticated using (public.is_active_user());
create policy inventory_admin_insert on public.inventory_items for insert to authenticated with check (public.is_admin());
create policy inventory_admin_update on public.inventory_items for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inventory_admin_delete on public.inventory_items for delete to authenticated using (public.is_admin());

create policy assets_read on public.asset_units for select to authenticated using (public.is_active_user());
create policy assets_admin_insert on public.asset_units for insert to authenticated with check (public.is_admin());
create policy assets_admin_update on public.asset_units for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy assets_admin_delete on public.asset_units for delete to authenticated using (public.is_admin());

create policy jobs_read on public.service_jobs for select to authenticated using (public.is_active_user());
create policy jobs_insert on public.service_jobs for insert to authenticated with check (public.is_active_user() and created_by = auth.uid());
create policy jobs_update on public.service_jobs for update to authenticated
using (public.is_admin() or (created_by = auth.uid() and status = 'draft'))
with check (public.is_admin() or created_by = auth.uid());
create policy jobs_delete on public.service_jobs for delete to authenticated using (public.is_admin());

create policy movement_read on public.stock_movements for select to authenticated using (public.is_active_user());
create policy movement_insert on public.stock_movements for insert to authenticated with check (public.is_active_user() and created_by = auth.uid());
create policy movement_admin_update on public.stock_movements for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy movement_admin_delete on public.stock_movements for delete to authenticated using (public.is_admin());

create policy audit_admin_read on public.audit_log for select to authenticated using (public.is_admin());
create policy audit_active_insert on public.audit_log for insert to authenticated with check (public.is_active_user() and actor_id = auth.uid());

insert into public.equipment(code,name_bm,name_en,category,service_interval_days,last_service) values
('COMP-01','Compressor #1','Compressor #1','compressor',30,current_date),
('COMP-02','Compressor #2','Compressor #2','compressor',30,current_date),
('COMP-03','Compressor #3','Compressor #3','compressor',30,current_date),
('GEN-01','Genset #1','Genset #1','genset',14,current_date),
('GEN-02','Genset #2','Genset #2','genset',14,current_date);

insert into public.inventory_items(sku,category,name_bm,name_en,variant,item_condition,quantity,unit,reorder_level) values
('TANK-ALL','Tank','Tangki Selam','Diving Tank',null,'in_service',150,'unit',20),
('FIN-XXS','Fins','Sirip Selam','Diving Fins','XXS','in_service',2,'pair',1),
('FIN-XS','Fins','Sirip Selam','Diving Fins','XS','in_service',8,'pair',2),
('FIN-S','Fins','Sirip Selam','Diving Fins','S','in_service',1,'pair',1),
('FIN-M','Fins','Sirip Selam','Diving Fins','M','in_service',4,'pair',1),
('FIN-L','Fins','Sirip Selam','Diving Fins','L','in_service',7,'pair',2),
('FIN-XL','Fins','Sirip Selam','Diving Fins','XL','in_service',2,'pair',1),
('FIN-XXL','Fins','Sirip Selam','Diving Fins','XXL','in_service',2,'pair',1),
('WET-1','Wetsuit','Pakaian Selam','Wetsuit','1','in_service',2,'unit',1),
('WET-2','Wetsuit','Pakaian Selam','Wetsuit','2','in_service',1,'unit',1),
('WET-3','Wetsuit','Pakaian Selam','Wetsuit','3','in_service',3,'unit',1),
('WET-4','Wetsuit','Pakaian Selam','Wetsuit','4','in_service',4,'unit',1),
('WET-5','Wetsuit','Pakaian Selam','Wetsuit','5','in_service',1,'unit',1),
('WET-6','Wetsuit','Pakaian Selam','Wetsuit','6','in_service',2,'unit',1),
('WET-7','Wetsuit','Pakaian Selam','Wetsuit','7','in_service',2,'unit',1),
('WET-8','Wetsuit','Pakaian Selam','Wetsuit','8','in_service',3,'unit',1),
('REG-NEW','Regulator','Regulator','Regulator','New','new',7,'unit',2),
('REG-OLD','Regulator','Regulator','Regulator','Old','old',13,'unit',2),
('BCD-XXS','BCD','BCD','BCD','XXS','in_service',1,'unit',1),
('BCD-XS','BCD','BCD','BCD','XS','in_service',2,'unit',1),
('BCD-S','BCD','BCD','BCD','S','in_service',10,'unit',2),
('BCD-M','BCD','BCD','BCD','M','in_service',6,'unit',2),
('BCD-L','BCD','BCD','BCD','L','in_service',2,'unit',1),
('BCD-XL','BCD','BCD','BCD','XL','in_service',1,'unit',1),
('BELT','Accessories','Tali Pinggang Pemberat','Weight Belt',null,'in_service',15,'pcs',3),
('WEIGHT','Accessories','Pemberat','Diving Weight',null,'in_service',115,'pcs',20),
('MASK','Accessories','Topeng Selam','Diving Mask',null,'in_service',31,'pcs',5),
('SNORKEL-NEW','Snorkel','Snorkel','Snorkel','New','new',20,'pcs',5),
('SNORKEL-OLD','Snorkel','Snorkel','Snorkel','Old','old',15,'pcs',3),
('BOAT-01','Boat','Bot Menyelam #1','Diving Boat #1',null,'in_service',1,'unit',0);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('job-media','job-media',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy job_media_read on storage.objects for select to authenticated
using (bucket_id = 'job-media' and public.is_active_user());
create policy job_media_insert on storage.objects for insert to authenticated
with check (bucket_id = 'job-media' and public.is_active_user() and (storage.foldername(name))[1] = auth.uid()::text);
create policy job_media_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'job-media' and public.is_admin());

grant execute on function public.set_my_pin(text) to authenticated;
grant execute on function public.verify_my_pin(text) to authenticated;
revoke all on public.staff_credentials from anon, authenticated;
