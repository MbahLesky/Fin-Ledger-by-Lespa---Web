alter table public.accounts
drop constraint if exists accounts_user_id_key;

create index if not exists accounts_user_id_idx
on public.accounts (user_id);

comment on table public.accounts is
'User-owned ledger accounts. A user may have multiple account rows; do not add a unique constraint on user_id alone.';