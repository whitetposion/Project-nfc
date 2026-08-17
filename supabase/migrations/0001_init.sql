-- ============================================================
-- NFC Digital Gifting Platform - Supabase Schema (M0)
-- Run in Supabase SQL Editor. Order matters.
-- Auth is handled by Supabase (auth.users). We extend it with
-- a profiles table. Never store passwords yourself.
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
create type order_status as enum (
  'pending', 'paid', 'processing', 'packed',
  'shipped', 'delivered', 'cancelled', 'returned'
);

create type product_status as enum ('draft', 'active', 'archived');
create type template_status as enum ('draft', 'published', 'archived');
create type asset_type as enum ('image', 'video', 'audio');
create type user_role as enum ('customer', 'admin');

-- ---------- PROFILES (extends auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role user_role not null default 'customer',
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper: is current user an admin?
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- ADDRESSES ----------
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,                         -- 'Home', 'Office'
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  country text not null default 'IN',
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_addresses_user on addresses(user_id);

-- ---------- PRODUCTS ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,                      -- 'flower', 'frame', 'keychain'
  base_price_inr integer not null,    -- paise. Never store money as float.
  status product_status not null default 'draft',
  media jsonb not null default '[]',  -- [{cloudinary_public_id, type, alt}]
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,                 -- 'Red', 'Wood'
  price_inr integer not null,         -- paise
  inventory integer not null default 0,
  sku text unique,
  created_at timestamptz not null default now()
);

create index idx_variants_product on product_variants(product_id);

-- ---------- ORDERS ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  status order_status not null default 'pending',
  razorpay_order_id text unique,
  razorpay_payment_id text,
  subtotal_inr integer not null,
  shipping_inr integer not null default 0,
  total_inr integer not null,
  shipping_address jsonb not null,    -- snapshot, not FK. Addresses change.
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  quantity integer not null check (quantity > 0),
  unit_price_inr integer not null     -- snapshot at purchase time
);

create index idx_order_items_order on order_items(order_id);

-- ---------- NFC TAGS ----------
create table nfc_tags (
  uid text primary key,               -- hardware UID, seeded by admin
  product_id uuid references products(id),
  order_id uuid references orders(id),
  owner_id uuid references profiles(id),
  claimed boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_nfc_owner on nfc_tags(owner_id);

-- One owner, forever. Enforced at DB level, not just app level.
create or replace function prevent_reclaim()
returns trigger language plpgsql as $$
begin
  if old.claimed = true and (
    new.owner_id is distinct from old.owner_id
    or new.claimed = false
  ) then
    raise exception 'NFC tag already claimed';
  end if;
  return new;
end; $$;

create trigger nfc_no_reclaim
  before update on nfc_tags
  for each row execute function prevent_reclaim();

-- ---------- UPDATED_AT AUTO-TOUCH ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger orders_touch before update on orders
  for each row execute function set_updated_at();

-- ---------- TEMPLATES ----------
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,             -- 'birthday', 'anniversary'
  schema jsonb not null,              -- Puck template JSON, never HTML
  preview_image text,                 -- cloudinary public_id
  status template_status not null default 'draft',
  created_at timestamptz not null default now()
);

-- ---------- EXPERIENCES ----------
create table experiences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  template_id uuid not null references templates(id),
  nfc_uid text not null unique references nfc_tags(uid),
  content jsonb not null default '{}', -- user's block content
  published boolean not null default false,
  slug text unique default encode(gen_random_bytes(6), 'hex'), -- share URL
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_experiences_owner on experiences(owner_id);

create trigger experiences_touch before update on experiences
  for each row execute function set_updated_at();

-- ---------- ASSETS ----------
create table assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  type asset_type not null,
  cloudinary_public_id text not null,
  url text not null,
  bytes integer,
  mime text,
  metadata jsonb default '{}',
  moderation_status text not null default 'pending', -- 'pending','approved','rejected'
  created_at timestamptz not null default now()
);

create index idx_assets_owner on assets(owner_id);

-- ---------- EXPERIENCE VIEWS (owner dashboard counter) ----------
-- PostHog handles deep analytics. This powers "Opened 14 times".
create table experience_views (
  id bigint generated always as identity primary key,
  experience_id uuid not null references experiences(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  device text,
  country text
);

create index idx_views_experience on experience_views(experience_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Rule of thumb: enable RLS on everything, whitelist access.
-- ============================================================

alter table profiles enable row level security;
alter table addresses enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table nfc_tags enable row level security;
alter table templates enable row level security;
alter table experiences enable row level security;
alter table assets enable row level security;
alter table experience_views enable row level security;

-- PROFILES: read own, update own. Admin reads all.
create policy "read own profile" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "update own profile" on profiles
  for update using (auth.uid() = id);
create policy "admin manages profiles" on profiles
  for all using (is_admin());

-- ADDRESSES: full CRUD on own rows only.
create policy "manage own addresses" on addresses
  for all using (auth.uid() = user_id);

-- PRODUCTS: public reads active. Admin does everything.
create policy "public reads active products" on products
  for select using (status = 'active' or is_admin());
create policy "admin manages products" on products
  for all using (is_admin());

create policy "public reads variants" on product_variants
  for select using (
    exists (select 1 from products p
            where p.id = product_id and p.status = 'active')
    or is_admin()
  );
create policy "admin manages variants" on product_variants
  for all using (is_admin());

-- ORDERS: users see own. Inserts go through the Node API
-- (service role bypasses RLS), so no insert policy for users.
create policy "read own orders" on orders
  for select using (auth.uid() = user_id or is_admin());
create policy "admin updates orders" on orders
  for update using (is_admin());

create policy "read own order items" on order_items
  for select using (
    exists (select 1 from orders o
            where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
  );

-- NFC TAGS: anyone can look up a tag (needed for tap flow).
-- Claiming happens via the Node API with service role.
create policy "public reads tags" on nfc_tags
  for select using (true);
create policy "admin manages tags" on nfc_tags
  for all using (is_admin());

-- TEMPLATES: public reads published. Admin manages.
create policy "public reads published templates" on templates
  for select using (status = 'published' or is_admin());
create policy "admin manages templates" on templates
  for all using (is_admin());

-- EXPERIENCES: the core rule of the product.
-- Public views published. Owner edits. Admin moderates.
create policy "public views published experiences" on experiences
  for select using (published = true or auth.uid() = owner_id or is_admin());
create policy "owner creates experience" on experiences
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from nfc_tags t
                where t.uid = nfc_uid and t.owner_id = auth.uid())
  );
create policy "owner updates experience" on experiences
  for update using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and exists (select 1 from nfc_tags t
                where t.uid = nfc_uid and t.owner_id = auth.uid())
  );
create policy "admin manages experiences" on experiences
  for all using (is_admin());

-- ASSETS: owner manages own. Admin moderates.
create policy "owner manages assets" on assets
  for all using (auth.uid() = owner_id or is_admin());
create policy "public reads approved assets" on assets
  for select using (moderation_status = 'approved');

-- VIEWS: anyone can log a view (anonymous receivers).
-- Only the experience owner reads counts.
create policy "anyone logs view" on experience_views
  for insert with check (true);
create policy "owner reads views" on experience_views
  for select using (
    exists (select 1 from experiences e
            where e.id = experience_id
              and (e.owner_id = auth.uid() or is_admin()))
  );

-- ============================================================
-- COLUMN-LEVEL GRANTS
-- RLS checks rows, not columns. Without these, a user could
-- UPDATE their own role to 'admin', or approve their own assets.
-- Admin writes to these columns go through the Node API
-- (service role bypasses grants and RLS).
-- ============================================================

revoke update on table profiles from authenticated, anon;
grant update (name, phone) on table profiles to authenticated;

revoke update on table assets from authenticated, anon;
grant update (metadata) on table assets to authenticated;

-- ============================================================
-- SEED: make yourself admin after first signup
-- update profiles set role = 'admin' where id = 'YOUR_AUTH_UID';
-- ============================================================