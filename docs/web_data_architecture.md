# Web Data Architecture

*Direct Supabase and Realtime Integration*

## Decision

Finance Ledger Web no longer uses a sync layer for shared business data. Supabase is the primary source of truth.

## Shared Data

Shared data lives in Supabase:

- profiles
- accounts
- categories
- transactions
- transfers
- settings
- notification_preferences

All access is tied to the active Supabase session.

Settings and notification preference rows are located by `user_id`. Their row `id` values are backend UUIDs and must not use local deterministic strings.

## Local-Only Data

Only these categories may stay local:

- import/export history
- temporary import preview and mapping state
- browser/device notification permission state
- transient UI preferences
- dismissed tips/tutorial state

## Realtime

The web app opens one Supabase Realtime channel per signed-in user. Table changes increment a realtime revision in app state. Backend query hooks refetch when that revision changes.

## Online-First Contract

Shared-data writes require network access. If offline or Supabase rejects the write, the UI must show failure and must not claim the data was saved.

## Out of Scope

- PowerSync
- Dexie shared-data storage
- offline mutation queue
- sync conflict resolution
