create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text null,
  email text null,
  phone_number text null,
  avatar_url text null,
  onboarding_completed boolean not null default false,
  preferred_currency text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  initial_balance numeric not null default 0,
  currency_code text not null,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  primary key (user_id, id)
);

create table if not exists public.categories (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  icon_key text null,
  color_key text null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  primary key (user_id, id)
);

create table if not exists public.transactions (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id text not null,
  category_id text not null,
  type text not null,
  amount numeric not null,
  note text not null default '',
  transaction_date timestamptz not null,
  reference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  primary key (user_id, id)
);

create table if not exists public.settings (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  currency_code text not null,
  theme_mode text not null,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.notification_preferences (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  reminder_time text null,
  timing_mode text not null default 'daily',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists accounts_user_id_updated_at_idx on public.accounts (user_id, updated_at desc);
create index if not exists categories_user_id_updated_at_idx on public.categories (user_id, updated_at desc);
create index if not exists transactions_user_id_updated_at_idx on public.transactions (user_id, updated_at desc);
create index if not exists settings_user_id_updated_at_idx on public.settings (user_id, updated_at desc);
create index if not exists notification_preferences_user_id_updated_at_idx on public.notification_preferences (user_id, updated_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.settings enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "accounts_access_own" on public.accounts;
create policy "accounts_access_own"
on public.accounts
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "categories_access_own" on public.categories;
create policy "categories_access_own"
on public.categories
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "transactions_access_own" on public.transactions;
create policy "transactions_access_own"
on public.transactions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "settings_access_own" on public.settings;
create policy "settings_access_own"
on public.settings
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_access_own" on public.notification_preferences;
create policy "notification_preferences_access_own"
on public.notification_preferences
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
