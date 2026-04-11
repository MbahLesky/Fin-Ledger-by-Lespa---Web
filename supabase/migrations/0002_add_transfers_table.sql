create table if not exists public.transfers (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  from_account_id text not null,
  to_account_id text not null,
  amount numeric not null check (amount > 0),
  fee numeric not null default 0 check (fee >= 0),
  note text not null default '',
  transfer_date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  primary key (user_id, id),
  constraint transfers_accounts_must_differ check (from_account_id <> to_account_id),
  constraint transfers_from_account_fk
    foreign key (user_id, from_account_id)
    references public.accounts (user_id, id)
    on delete restrict,
  constraint transfers_to_account_fk
    foreign key (user_id, to_account_id)
    references public.accounts (user_id, id)
    on delete restrict
);

create index if not exists transfers_user_id_updated_at_idx on public.transfers (user_id, updated_at desc);

drop trigger if exists transfers_set_updated_at on public.transfers;
create trigger transfers_set_updated_at
before update on public.transfers
for each row
execute function public.set_updated_at();

alter table public.transfers enable row level security;

drop policy if exists "transfers_access_own" on public.transfers;
create policy "transfers_access_own"
on public.transfers
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
