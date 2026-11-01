-- =====================================================================
-- Karigar database schema (Supabase / PostgreSQL), final state.
-- Run once in the SQL Editor of a NEW Supabase project.
-- =====================================================================

-- ---------- Tables ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'dispatcher', 'admin')),
  created_at timestamptz not null default now()
);

create table categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  active boolean not null default true
);

create table providers (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  whatsapp text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'suspended')),
  available boolean not null default true,
  areas text[] not null default '{}',
  experience_years integer,
  avg_rating numeric(2,1),
  jobs_completed integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index providers_user_id_key on providers (user_id) where user_id is not null;
create unique index providers_whatsapp_key on providers (whatsapp);

create table provider_categories (
  provider_id bigint references providers(id) on delete cascade,
  category_id bigint references categories(id) on delete cascade,
  primary key (provider_id, category_id)
);

create table service_requests (
  id bigint generated always as identity primary key,
  customer_id uuid not null references profiles(id),
  category_id bigint not null references categories(id),
  description text not null,
  address text not null,
  city text not null,
  preferred_time timestamptz,
  budget integer check (budget > 0),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  photo_paths text[] not null default '{}',
  status text not null default 'new' check (status in
    ('new', 'dispatching', 'offers_received', 'confirmed', 'on_the_way', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint sr_limits check (
    char_length(description) <= 2000 and char_length(address) <= 300 and char_length(city) <= 80
    and (budget is null or budget <= 10000000)),
  constraint service_requests_photo_count check (cardinality(photo_paths) <= 3)
);

create table offers (
  id bigint generated always as identity primary key,
  request_id bigint not null references service_requests(id) on delete cascade,
  provider_id bigint not null references providers(id),
  provider_name text not null,
  provider_rating numeric(2,1),
  price integer not null check (price > 0),
  eta_minutes integer,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  constraint offers_limits check (price <= 10000000 and (eta_minutes is null or eta_minutes between 1 and 2880))
);
create unique index offers_one_per_provider on offers (request_id, provider_id);

create table job_events (
  id bigint generated always as identity primary key,
  request_id bigint not null references service_requests(id) on delete cascade,
  status text not null,
  changed_by uuid,
  note text,
  created_at timestamptz not null default now()
);

create table reviews (
  id bigint generated always as identity primary key,
  request_id bigint not null unique references service_requests(id),
  provider_id bigint references providers(id),
  customer_id uuid not null references profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint review_limits check (comment is null or char_length(comment) <= 1000)
);

create table complaints (
  id bigint generated always as identity primary key,
  request_id bigint not null references service_requests(id),
  customer_id uuid not null references profiles(id),
  details text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  constraint complaint_limits check (char_length(details) <= 1000)
);

create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read, created_at desc);

-- ---------- Helper functions used by security rules ----------
create function is_staff() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('dispatcher', 'admin'));
$$;

create function my_provider_id() returns bigint language sql security definer stable set search_path = public as $$
  select id from providers where user_id = auth.uid() and status = 'verified' limit 1;
$$;

create function provider_can_offer(p_request bigint) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from service_requests r
    join provider_categories pc on pc.category_id = r.category_id
    join providers p on p.id = pc.provider_id
    where r.id = p_request
      and r.status in ('new', 'dispatching', 'offers_received')
      and p.user_id = auth.uid() and p.status = 'verified' and p.available
  );
$$;

create function provider_can_see_photo(p_name text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from service_requests r
    join offers o on o.request_id = r.id and o.status = 'accepted'
    join providers p on p.id = o.provider_id
    where p.user_id = auth.uid() and p.status = 'verified' and p_name = any (r.photo_paths)
  );
$$;

-- ---------- Trigger functions ----------
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end; $$;

create function protect_profile_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Role cannot be changed';
  end if;
  return new;
end; $$;

create function log_request_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into job_events (request_id, status, changed_by) values (new.id, new.status, auth.uid());
  end if;
  return new;
end; $$;

create function limit_new_request() returns trigger language plpgsql security definer set search_path = public as $$
declare p text;
begin
  if not is_staff() then
    if (select count(*) from service_requests where customer_id = new.customer_id and created_at > now() - interval '1 hour') >= 5
       or (select count(*) from service_requests where customer_id = new.customer_id and created_at > now() - interval '1 day') >= 15 then
      raise exception 'Too many requests. Please try again later.';
    end if;
  end if;
  foreach p in array new.photo_paths loop
    if p !~ ('^' || new.customer_id::text || '/[0-9a-f-]{36}\.jpg$') then
      raise exception 'Invalid photo';
    end if;
  end loop;
  return new;
end; $$;

create function limit_complaints() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from complaints where customer_id = new.customer_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Too many complaints today.';
  end if;
  return new;
end; $$;

create function set_review_provider() returns trigger language plpgsql security definer set search_path = public as $$
begin
  select provider_id into new.provider_id from offers where request_id = new.request_id and status = 'accepted' limit 1;
  return new;
end; $$;

create function refresh_provider_rating() returns trigger language plpgsql security definer set search_path = public as $$
declare pid bigint := coalesce(new.provider_id, old.provider_id);
begin
  update providers
  set avg_rating = (select round(avg(rating)::numeric, 1) from reviews where provider_id = pid and not hidden)
  where id = pid;
  return null;
end; $$;

create function count_completed_job() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update providers set jobs_completed = jobs_completed + 1
    where id = (select provider_id from offers where request_id = new.id and status = 'accepted' limit 1);
  end if;
  return new;
end; $$;

create function offers_fill_provider() returns trigger language plpgsql security definer set search_path = public as $$
begin
  select full_name, avg_rating into new.provider_name, new.provider_rating from providers where id = new.provider_id;
  return new;
end; $$;

create function notify_offer_created() returns trigger language plpgsql security definer set search_path = public as $$
declare v_customer uuid; v_cat text;
begin
  select r.customer_id, c.name into v_customer, v_cat
  from service_requests r join categories c on c.id = r.category_id where r.id = new.request_id;
  if v_customer is not null then
    insert into notifications (user_id, title, body, link)
    values (v_customer, 'New offer received',
            new.provider_name || ' offered Rs ' || new.price || ' for your ' || v_cat || ' request.',
            '/requests/' || new.request_id);
  end if;
  update service_requests set status = 'offers_received' where id = new.request_id and status in ('new', 'dispatching');
  return new;
end; $$;

create function notify_offer_status() returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if new.status is distinct from old.status and new.status in ('accepted', 'rejected') then
    select user_id into v_user from providers where id = new.provider_id;
    if v_user is not null then
      insert into notifications (user_id, title, body, link)
      values (v_user,
              case when new.status = 'accepted' then 'Your offer was accepted' else 'Your offer was not selected' end,
              'Request KH-' || lpad(new.request_id::text, 6, '0') || ' (Rs ' || new.price || ')',
              '/provider/jobs/' || new.request_id);
    end if;
    if new.status = 'accepted' then
      insert into notifications (user_id, title, body, link)
      select pr.id, 'Offer accepted',
             'KH-' || lpad(new.request_id::text, 6, '0') || ': ' || new.provider_name || ' at Rs ' || new.price,
             '/admin/requests/' || new.request_id
      from profiles pr where pr.role in ('admin', 'dispatcher');
    end if;
  end if;
  return new;
end; $$;

create function notify_new_request() returns trigger language plpgsql security definer set search_path = public as $$
declare v_cat text;
begin
  select name into v_cat from categories where id = new.category_id;
  insert into notifications (user_id, title, body, link)
  select p.user_id, 'New ' || v_cat || ' job in ' || new.city, left(new.description, 120), '/provider/jobs/' || new.id
  from providers p
  join provider_categories pc on pc.provider_id = p.id and pc.category_id = new.category_id
  where p.user_id is not null and p.status = 'verified' and p.available;
  insert into notifications (user_id, title, body, link)
  select pr.id, 'New request KH-' || lpad(new.id::text, 6, '0'),
         v_cat || ' in ' || new.city || ': ' || left(new.description, 100), '/admin/requests/' || new.id
  from profiles pr where pr.role in ('admin', 'dispatcher');
  return new;
end; $$;

create function notify_status_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('on_the_way', 'in_progress', 'completed') then
    insert into notifications (user_id, title, body, link)
    values (new.customer_id,
            case new.status when 'on_the_way' then 'Your professional is on the way'
                            when 'in_progress' then 'Work has started' else 'Job completed' end,
            case new.status when 'completed' then 'Please rate your professional. Request KH-' || lpad(new.id::text, 6, '0')
                            else 'Request KH-' || lpad(new.id::text, 6, '0') end,
            '/requests/' || new.id);
  end if;
  return new;
end; $$;

create function notify_staff_complaint() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, title, body, link)
  select pr.id, 'New complaint', 'Request KH-' || lpad(new.request_id::text, 6, '0'), '/admin/complaints'
  from profiles pr where pr.role in ('admin', 'dispatcher');
  return new;
end; $$;

create function notify_provider_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null and new.status is distinct from old.status then
    if new.status = 'verified' then
      insert into notifications (user_id, title, body, link)
      values (new.user_id, 'Your profile is verified', 'You can now see jobs and send offers.', '/provider');
    elsif new.status = 'suspended' then
      insert into notifications (user_id, title, body, link)
      values (new.user_id, 'Your profile was suspended', 'Please contact support.', '/provider');
    end if;
  end if;
  return new;
end; $$;

-- ---------- Triggers ----------
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create trigger profile_role_guard before update on profiles for each row execute function protect_profile_role();
create trigger request_limits before insert on service_requests for each row execute function limit_new_request();
create trigger request_status_log after insert or update on service_requests for each row execute function log_request_status();
create trigger request_completed_count after update on service_requests for each row execute function count_completed_job();
create trigger request_created_notify after insert on service_requests for each row execute function notify_new_request();
create trigger request_status_notify after update of status on service_requests for each row execute function notify_status_change();
create trigger complaint_limits_trg before insert on complaints for each row execute function limit_complaints();
create trigger complaint_notify after insert on complaints for each row execute function notify_staff_complaint();
create trigger review_set_provider before insert on reviews for each row execute function set_review_provider();
create trigger review_refresh_rating after insert or update on reviews for each row execute function refresh_provider_rating();
create trigger offers_before_insert before insert on offers for each row execute function offers_fill_provider();
create trigger offer_created_notify after insert on offers for each row execute function notify_offer_created();
create trigger offer_status_notify after update of status on offers for each row execute function notify_offer_status();
create trigger provider_status_notify after update of status on providers for each row execute function notify_provider_status();

-- ---------- Functions called from the app ----------
create function accept_offer(p_offer_id bigint) returns void language plpgsql security definer set search_path = public as $$
declare v_req bigint;
begin
  select o.request_id into v_req from offers o join service_requests r on r.id = o.request_id
  where o.id = p_offer_id and o.status = 'pending' and r.customer_id = auth.uid()
    and r.status in ('dispatching', 'offers_received');
  if v_req is null then raise exception 'Offer cannot be accepted'; end if;
  update offers set status = case when id = p_offer_id then 'accepted' else 'rejected' end
  where request_id = v_req and status = 'pending';
  update service_requests set status = 'confirmed' where id = v_req;
end; $$;

create function decline_offer(p_offer_id bigint) returns void language plpgsql security definer set search_path = public as $$
declare v_req bigint;
begin
  select o.request_id into v_req from offers o join service_requests r on r.id = o.request_id
  where o.id = p_offer_id and o.status = 'pending' and r.customer_id = auth.uid()
    and r.status in ('dispatching', 'offers_received');
  if v_req is null then raise exception 'Offer cannot be declined'; end if;
  update offers set status = 'rejected' where id = p_offer_id;
end; $$;

create function apply_as_provider(
  p_name text, p_whatsapp text, p_areas text[], p_years integer, p_category_ids bigint[]
) returns void language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  if length(trim(p_name)) < 2 or length(p_name) > 80 then raise exception 'Invalid name'; end if;
  if p_whatsapp !~ '^92[0-9]{10}$' then raise exception 'Invalid WhatsApp number'; end if;
  if coalesce(array_length(p_category_ids, 1), 0) not between 1 and 6 then raise exception 'Choose 1 to 6 services'; end if;
  if coalesce(array_length(p_areas, 1), 0) > 10 then raise exception 'Too many areas'; end if;
  if exists (select 1 from unnest(coalesce(p_areas, '{}')) a where length(a) > 60) then raise exception 'Area name too long'; end if;
  if p_years is not null and (p_years < 0 or p_years > 60) then raise exception 'Invalid experience'; end if;
  if exists (select 1 from providers where user_id = auth.uid()) then raise exception 'You have already applied'; end if;
  if exists (select 1 from providers where whatsapp = p_whatsapp) then raise exception 'This number is already registered'; end if;
  if (select count(*) from providers where status = 'pending' and created_at > now() - interval '1 hour') >= 15 then
    raise exception 'Too many applications right now. Please try again later.';
  end if;

  insert into providers (full_name, whatsapp, status, available, areas, experience_years, user_id)
  values (trim(p_name), p_whatsapp, 'pending', true, coalesce(p_areas, '{}'), p_years, auth.uid())
  returning id into v_id;

  insert into provider_categories (provider_id, category_id)
  select v_id, c.id from categories c where c.id = any (p_category_ids);

  insert into notifications (user_id, title, body, link)
  select pr.id, 'New professional application', trim(p_name) || ' applied to join.', '/admin/providers'
  from profiles pr where pr.role in ('admin', 'dispatcher');
end; $$;

create function my_provider()
returns table (id bigint, full_name text, status text, available boolean, avg_rating numeric, jobs_completed integer)
language sql security definer stable set search_path = public as $$
  select p.id, p.full_name, p.status, p.available, p.avg_rating, p.jobs_completed
  from providers p where p.user_id = auth.uid() limit 1;
$$;

create function provider_open_jobs()
returns table (
  id bigint, category_name text, description text, city text, budget integer,
  preferred_time timestamptz, created_at timestamptz, status text,
  my_offer_id bigint, my_offer_price integer, my_offer_status text
)
language sql security definer stable set search_path = public as $$
  select r.id, c.name, r.description, r.city, r.budget, r.preferred_time, r.created_at, r.status,
         o.id, o.price, o.status
  from providers p
  join provider_categories pc on pc.provider_id = p.id
  join service_requests r on r.category_id = pc.category_id
  join categories c on c.id = r.category_id
  left join offers o on o.request_id = r.id and o.provider_id = p.id
  where p.user_id = auth.uid() and p.status = 'verified'
    and r.status in ('new', 'dispatching', 'offers_received')
  order by r.created_at desc
  limit 100;
$$;

create function provider_job(p_id bigint)
returns table (
  id bigint, category_name text, description text, city text, budget integer,
  preferred_time timestamptz, created_at timestamptz, status text,
  my_offer_id bigint, my_offer_price integer, my_offer_eta integer, my_offer_status text,
  can_offer boolean,
  address text, customer_name text, customer_phone text,
  latitude double precision, longitude double precision, photo_paths text[]
)
language sql security definer stable set search_path = public as $$
  with me as (
    select p.id as pid from providers p where p.user_id = auth.uid() and p.status = 'verified' limit 1
  )
  select r.id, c.name, r.description, r.city, r.budget, r.preferred_time, r.created_at, r.status,
         o.id, o.price, o.eta_minutes, o.status,
         (o.id is null and r.status in ('new', 'dispatching', 'offers_received') and m.matches),
         case when o.status = 'accepted' then r.address end,
         case when o.status = 'accepted' then pr.full_name end,
         case when o.status = 'accepted' then pr.phone end,
         case when o.status = 'accepted' then r.latitude end,
         case when o.status = 'accepted' then r.longitude end,
         case when o.status = 'accepted' then r.photo_paths end
  from me
  join service_requests r on r.id = p_id
  join categories c on c.id = r.category_id
  join profiles pr on pr.id = r.customer_id
  left join offers o on o.request_id = r.id and o.provider_id = me.pid
  cross join lateral (
    select exists (select 1 from provider_categories pc where pc.provider_id = me.pid and pc.category_id = r.category_id) as matches
  ) m
  where o.id is not null or (r.status in ('new', 'dispatching', 'offers_received') and m.matches);
$$;

create function provider_my_jobs()
returns table (id bigint, category_name text, description text, city text, status text, my_offer_price integer, created_at timestamptz)
language sql security definer stable set search_path = public as $$
  select r.id, c.name, r.description, r.city, r.status, o.price, r.created_at
  from providers p
  join offers o on o.provider_id = p.id and o.status = 'accepted'
  join service_requests r on r.id = o.request_id
  join categories c on c.id = r.category_id
  where p.user_id = auth.uid() and p.status = 'verified'
  order by r.created_at desc
  limit 100;
$$;

create function send_offer(p_request bigint, p_price integer, p_eta integer) returns void
language plpgsql security definer set search_path = public as $$
declare v_pid bigint;
begin
  select p.id into v_pid from providers p
  where p.user_id = auth.uid() and p.status = 'verified' and p.available limit 1;
  if v_pid is null then raise exception 'Your profile is not verified or you are marked unavailable'; end if;
  if not provider_can_offer(p_request) then raise exception 'This job is no longer open'; end if;
  if p_price is null or p_price <= 0 or p_price > 10000000 then raise exception 'Invalid price'; end if;
  if p_eta is not null and (p_eta < 1 or p_eta > 2880) then raise exception 'Invalid arrival time'; end if;
  if (select count(*) from offers where provider_id = v_pid and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many offers. Please try again later.';
  end if;
  insert into offers (request_id, provider_id, provider_name, price, eta_minutes) values (p_request, v_pid, '', p_price, p_eta);
end; $$;

create function set_my_availability(p_available boolean) returns void
language sql security definer set search_path = public as $$
  update providers set available = p_available where user_id = auth.uid() and status = 'verified';
$$;

create function link_provider_account(p_provider bigint, p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_uid is null then raise exception 'No account found with this email'; end if;
  if exists (select 1 from providers where user_id = v_uid and id <> p_provider) then
    raise exception 'This account is already linked to another professional';
  end if;
  update providers set user_id = v_uid where id = p_provider;
end; $$;

create function unlink_provider_account(p_provider bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  update providers set user_id = null where id = p_provider;
end; $$;

create function admin_provider_accounts() returns table (provider_id bigint, email text)
language sql security definer stable set search_path = public as $$
  select p.id, u.email::text from providers p join auth.users u on u.id = p.user_id where public.is_staff();
$$;

-- ---------- Function permissions: nothing is callable unless granted ----------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function is_staff(), my_provider_id(), provider_can_offer(bigint), provider_can_see_photo(text),
  accept_offer(bigint), decline_offer(bigint), apply_as_provider(text, text, text[], integer, bigint[]),
  my_provider(), provider_open_jobs(), provider_job(bigint), provider_my_jobs(),
  send_offer(bigint, integer, integer), set_my_availability(boolean),
  link_provider_account(bigint, text), unlink_provider_account(bigint), admin_provider_accounts()
  to authenticated;

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table categories enable row level security;
alter table providers enable row level security;
alter table provider_categories enable row level security;
alter table service_requests enable row level security;
alter table offers enable row level security;
alter table job_events enable row level security;
alter table reviews enable row level security;
alter table complaints enable row level security;
alter table notifications enable row level security;

-- ---------- Table permissions (least privilege) ----------
revoke all on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;

grant select on categories to anon;
grant select, insert, update, delete on categories, providers, provider_categories to authenticated;
grant select on profiles to authenticated;
grant update (full_name, phone) on profiles to authenticated;
grant select on service_requests to authenticated;
grant insert (customer_id, category_id, description, address, city, preferred_time, budget, latitude, longitude, photo_paths)
  on service_requests to authenticated;
grant update (status) on service_requests to authenticated;
grant select, insert, update, delete on offers to authenticated;
grant select, insert on job_events to authenticated;
grant select on reviews to authenticated;
grant insert (request_id, customer_id, rating, comment) on reviews to authenticated;
grant update (hidden) on reviews to authenticated;
grant select on complaints to authenticated;
grant insert (request_id, customer_id, details) on complaints to authenticated;
grant update (status) on complaints to authenticated;
grant select on notifications to authenticated;
grant update (read) on notifications to authenticated;

-- ---------- Row Level Security policies ----------
create policy "read own profile or staff" on profiles for select to authenticated using (id = auth.uid() or is_staff());
create policy "update own profile" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "anon reads active categories" on categories for select to anon using (active);
create policy "authenticated reads categories" on categories for select to authenticated using (active or is_staff());
create policy "staff manage categories" on categories for all to authenticated using (is_staff()) with check (is_staff());

create policy "staff manage providers" on providers for all to authenticated using (is_staff()) with check (is_staff());
create policy "staff manage provider categories" on provider_categories for all to authenticated using (is_staff()) with check (is_staff());

create policy "customer creates request" on service_requests for insert to authenticated
  with check (customer_id = auth.uid() and status = 'new');
create policy "read own requests or staff" on service_requests for select to authenticated
  using (customer_id = auth.uid() or is_staff());
create policy "staff update requests" on service_requests for update to authenticated
  using (is_staff()) with check (is_staff());
create policy "customer cancels request" on service_requests for update to authenticated
  using (customer_id = auth.uid() and status in ('new', 'dispatching', 'offers_received'))
  with check (customer_id = auth.uid() and status = 'cancelled');

create policy "staff manage offers" on offers for all to authenticated using (is_staff()) with check (is_staff());
create policy "customer reads own offers" on offers for select to authenticated
  using (exists (select 1 from service_requests r where r.id = request_id and r.customer_id = auth.uid()));
create policy "provider sends offer" on offers for insert to authenticated
  with check (provider_id = my_provider_id() and status = 'pending' and provider_can_offer(request_id));
create policy "provider reads own offers" on offers for select to authenticated using (provider_id = my_provider_id());
create policy "provider withdraws pending offer" on offers for delete to authenticated
  using (provider_id = my_provider_id() and status = 'pending');

create policy "read own job events or staff" on job_events for select to authenticated
  using (is_staff() or exists (select 1 from service_requests r where r.id = request_id and r.customer_id = auth.uid()));
create policy "staff add job events" on job_events for insert to authenticated with check (is_staff());

create policy "read visible reviews" on reviews for select to authenticated using (not hidden or is_staff());
create policy "customer reviews completed job" on reviews for insert to authenticated
  with check (customer_id = auth.uid() and exists (
    select 1 from service_requests r where r.id = request_id and r.customer_id = auth.uid() and r.status = 'completed'));
create policy "staff moderate reviews" on reviews for update to authenticated using (is_staff()) with check (is_staff());

create policy "customer files complaint" on complaints for insert to authenticated with check (customer_id = auth.uid());
create policy "read own complaints or staff" on complaints for select to authenticated using (customer_id = auth.uid() or is_staff());
create policy "staff update complaints" on complaints for update to authenticated using (is_staff()) with check (is_staff());

create policy "read own notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "update own notifications" on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Realtime ----------
alter table offers replica identity full;
alter publication supabase_realtime add table service_requests, offers, notifications;

-- ---------- Private photo storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 2097152, array['image/jpeg']);

create policy "customers upload own request photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'request-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (select count(*) from storage.objects o
         where o.bucket_id = 'request-photos' and (storage.foldername(o.name))[1] = auth.uid()::text) < 60);
create policy "read own or staff request photos" on storage.objects for select to authenticated
  using (bucket_id = 'request-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
create policy "provider reads accepted job photos" on storage.objects for select to authenticated
  using (bucket_id = 'request-photos' and public.provider_can_see_photo(name));

-- ---------- Starting data ----------
insert into categories (name, description) values
  ('Plumber', 'Leaks, geysers, taps'),
  ('Electrician', 'Wiring, switches, fans'),
  ('Maid', 'Cleaning and home help'),
  ('AC technician', 'Service and repair'),
  ('Carpenter', 'Furniture and doors'),
  ('Painter', 'Painting and polish');