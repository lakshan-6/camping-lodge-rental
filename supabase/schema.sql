create extension if not exists pgcrypto;
create table public.settings(id int primary key default 1 check(id=1), data jsonb not null);
create table public.roles(user_id uuid primary key references auth.users on delete cascade, role text not null check(role in ('Owner','Staff')));
create table public.catalog(id uuid primary key default gen_random_uuid(), name text not null, category text not null, description text default '', price numeric(12,2) not null check(price>=0), stock int not null check(stock>=0), images text[] default '{}', specs text default '', active boolean default true, featured boolean default false, sale_price numeric(12,2), created_at timestamptz default now());
create table public.categories(id uuid primary key default gen_random_uuid(), name text unique not null);
create table public.packages(id uuid primary key default gen_random_uuid(), name text not null, description text default '', price numeric(12,2) not null check(price>=0), items jsonb not null, image text default '', featured boolean default false, active boolean default true);
create table public.guides(id uuid primary key default gen_random_uuid(), title text not null, category text not null, content text not null, image text default '', active boolean default true);
create table public.profiles(id uuid primary key references auth.users on delete cascade, name text default '', phone text default '', address text default '');
create table public.favorites(user_id uuid references auth.users on delete cascade, item_id uuid references catalog on delete cascade, primary key(user_id,item_id));
create table public.orders(id uuid primary key default gen_random_uuid(), number bigint generated always as identity unique, user_id uuid references auth.users on delete set null, name text not null, phone text not null, pickup date not null, return_date date not null check(return_date>pickup), delivery boolean default false, address text default '', notes text default '', lines jsonb not null, total numeric(12,2) not null, status text default 'Pending' check(status in ('Pending','Confirmed','Picked up','Returned','Cancelled')), created_at timestamptz default now());
create table public.messages(id uuid primary key default gen_random_uuid(), name text not null, phone text, email text not null, subject text not null, message text not null, read boolean default false, created_at timestamptz default now());
create table public.subscribers(id uuid primary key default gen_random_uuid(), name text not null, contact text not null, created_at timestamptz default now());
do $$ declare t text; begin foreach t in array array['settings','roles','catalog','categories','packages','guides','profiles','favorites','orders','messages','subscribers'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
-- Public reads are served by the API with explicit field selection. No direct anonymous writes.
create policy profile_self on profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy favorites_self on favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy orders_self on orders for select to authenticated using(user_id=auth.uid());
-- Serialize booking and status transitions; all quantities are expanded into item IDs by the server.
create or replace function public.check_stock(p_lines jsonb,p_pickup date,p_return date,p_exclude uuid default null) returns void language plpgsql set search_path=public as $$
declare r record; available int; begin
perform pg_advisory_xact_lock(731921);
for r in select (x->>'item_id')::uuid item_id,sum((x->>'quantity')::int)::int qty from jsonb_array_elements(p_lines) x group by 1 loop
select stock into available from catalog where id=r.item_id and active;
if available is null or r.qty<1 then raise exception 'Invalid item'; end if;
select available-coalesce(sum((l->>'quantity')::int),0) into available from orders o cross join lateral jsonb_array_elements(o.lines) l where o.status in ('Pending','Confirmed','Picked up') and o.pickup<p_return and o.return_date>p_pickup and o.id is distinct from p_exclude and l->>'item_id'=r.item_id::text;
if available<r.qty then raise exception 'Insufficient stock for selected dates'; end if;
end loop; end $$;
create or replace function public.book(p jsonb) returns orders language plpgsql set search_path=public as $$ declare result orders; begin
perform check_stock(p->'lines',(p->>'pickup')::date,(p->>'return_date')::date);
insert into orders(user_id,name,phone,pickup,return_date,delivery,address,notes,lines,total) values ((p->>'user_id')::uuid,p->>'name',p->>'phone',(p->>'pickup')::date,(p->>'return_date')::date,(p->>'delivery')::boolean,p->>'address',p->>'notes',p->'lines',(p->>'total')::numeric) returning * into result; return result; end $$;
create or replace function public.change_status(p_id uuid,p_status text) returns void language plpgsql set search_path=public as $$ declare o orders; begin perform pg_advisory_xact_lock(731921); select * into strict o from orders where id=p_id; if p_status in ('Pending','Confirmed','Picked up') then perform check_stock(o.lines,o.pickup,o.return_date,o.id); end if; update orders set status=p_status where id=p_id; end $$;
revoke execute on function public.check_stock(jsonb,date,date,uuid),public.book(jsonb),public.change_status(uuid,text) from public,anon,authenticated;
grant execute on function public.check_stock(jsonb,date,date,uuid),public.book(jsonb),public.change_status(uuid,text) to service_role;
insert into storage.buckets(id,name,public) values('gear','gear',true) on conflict do nothing;
