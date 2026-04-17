# Entity Relationship

*Finance Ledger Web*

## Active Entities

- User (`auth.users`)
- Profile (`public.profiles`)
- Account
- Category
- Transaction
- Transfer
- Settings
- NotificationPreference
- ImportRecord (local-only)
- ExportRecord (local-only)

## Relationships

- one User has one Profile
- one User has many Accounts
- one User has many Categories
- one User has many Transactions
- one User has many Transfers
- one User has one Settings row
- one User has one NotificationPreference row
- Transaction belongs to one Account
- Transaction belongs to one Category
- Transfer belongs to one source Account
- Transfer belongs to one destination Account
- ImportRecord and ExportRecord belong only to the current browser/device history

## Ownership

Supabase RLS enforces:

- `profiles.id = auth.uid()`
- business table `user_id = auth.uid()`

## Derived Relationships

- account current balance is derived from opening balance, transactions, transfers, and fees
- dashboard and analytics are derived from source tables

## Removed Entity

The former local SyncOperation/outbox entity is removed from the web app.
