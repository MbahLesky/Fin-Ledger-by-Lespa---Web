# PowerSync Integration Plan

*Finance Ledger - PowerSync Foundation Phase*

## Purpose

This document defines how Finance Ledger now introduces PowerSync without giving up the app's local-first behavior.

## Why PowerSync Was Added

- the app already relied on Drift and SQLite for a strong offline experience
- Supabase already existed for auth and profile ownership
- the next backend step needed a sync layer instead of ad-hoc direct CRUD from widgets
- PowerSync lets the app keep local reads and writes while preparing authenticated multi-device continuity

## Current Architecture

```text
Flutter UI
-> Riverpod state and controllers
-> Drift DAOs and models
-> SQLite on device
-> PowerSync raw-table sync layer
-> Supabase / Postgres
```

Important clarification:

- `public.profiles` remains part of the direct Supabase auth/profile flow in this phase
- ledger and settings business tables are the PowerSync sync-ready layer
- if `POWERSYNC_URL` is not configured, the app still runs locally and offline without breaking

## Drift and PowerSync Coexistence

Finance Ledger keeps Drift as the app-facing persistence layer.

PowerSync is integrated underneath Drift by:

- opening the same SQLite database file through `PowerSyncDatabase`
- letting Drift use that connection through `drift_sqlite_async`
- registering the Drift-managed tables as PowerSync raw tables
- recreating PowerSync CRUD triggers after schema open

This means:

- Drift keeps type-safe DAOs, watch streams, and existing feature logic
- PowerSync tracks local mutations for sync
- widgets still do not talk directly to PowerSync

## Sync Scope

### Syncable tables in this phase

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

### Direct remote auth/profile table in this phase

- `public.profiles`

`public.profiles` is still created and updated directly through Supabase because it is part of the auth bootstrap and session-aware routing path.

### Local-only / non-sync source-of-truth exclusions

- `import_records`
- `export_records`
- dashboard summaries
- analytics summaries
- computed balances
- active filters
- temporary form state
- preview/import temporary state

## Backend Table Shape

Remote business tables now use user ownership as part of their key shape:

- composite identity: `(user_id, id)`
- `id` remains the app-level local identifier already used in Drift
- `user_id` anchors ownership and prevents cross-user collisions for defaults like `default-cash`

This keeps the current local IDs stable while making the remote schema safe for multiple users.

## Authenticated Sync Context

- PowerSync credentials are derived from the active Supabase session JWT
- sync starts only after the user is authenticated and `POWERSYNC_URL` is configured
- sign out disconnects PowerSync cleanly
- when the local workspace is reset for a different user, PowerSync state is cleared before reseeding defaults

## Current Sync Behavior

### When offline

- the app keeps using Drift and SQLite normally
- local writes continue to work
- PowerSync queues syncable writes for later upload when available

### When online and configured

- PowerSync connects with the authenticated Supabase JWT
- remote changes download into the local raw tables
- local changes upload through the PowerSync connector using Supabase table upserts/deletes guarded by RLS

### When PowerSync is not configured

- the app stays local-first
- no backend sync connection is opened
- the implementation still preserves the sync-ready architecture

## Existing Data Safety

For installs that already had local data before this phase:

- existing syncable rows are queued once during the PowerSync migration so they are not ignored later
- local-only history tables remain excluded from sync

## Sync Stream Shape

Recommended PowerSync Sync Streams configuration:

```yaml
config:
  edition: 3
streams:
  user_ledger:
    auto_subscribe: true
    queries:
      - SELECT id, user_id, name, type, initial_balance, currency_code, is_default, is_archived, display_order, created_at, updated_at, deleted_at FROM public.accounts WHERE user_id = auth.user_id()
      - SELECT id, user_id, name, type, icon_key, color_key, is_system, is_active, created_at, updated_at, deleted_at FROM public.categories WHERE user_id = auth.user_id()
      - SELECT id, user_id, account_id, category_id, type, amount, note, transaction_date, reference, created_at, updated_at, deleted_at FROM public.transactions WHERE user_id = auth.user_id()
      - SELECT id, user_id, currency_code, theme_mode, onboarding_complete, created_at, updated_at FROM public.settings WHERE user_id = auth.user_id()
      - SELECT id, user_id, enabled, reminder_time, timing_mode, created_at, updated_at FROM public.notification_preferences WHERE user_id = auth.user_id()
```

## Supabase / PowerSync Setup Still Required Outside the App

The app-side code now expects the backend environment to be finished with:

- the Supabase migrations applied
- or `supabase/sql/remote_sync_bootstrap.sql` run in the Supabase SQL editor when bootstrapping the remote project manually
- a PowerSync instance connected to Supabase
- Supabase Auth enabled in PowerSync
- a `powersync_role` replication user created in Supabase
- `POWERSYNC_URL` supplied to the Flutter app

## Conflict and Safety Notes

This phase prepares for sync safely but does not try to overengineer final conflict handling.

Future work still needs to formalize:

- transaction edits on multiple devices
- account and category edits on multiple devices
- soft-delete versus hard-delete rules
- import-created rows later syncing to existing backend data
- richer reconciliation and user-visible conflict UX

Current bias:

- keep source records canonical
- preserve `created_at`, `updated_at`, and `deleted_at`
- prefer idempotent upserts during upload

## In Scope Now

- PowerSync package integration in Flutter
- Drift + PowerSync raw-table alignment
- auth-aware sync connection management
- remote Supabase ledger table migrations and RLS
- local-first fallback when PowerSync config is absent
- documentation of syncable versus local-only data

## Out of Scope Still

- WhatsApp chatbot
- advanced conflict-resolution UX
- background job orchestration beyond PowerSync
- full Google auth
- full phone auth
- advanced multi-device polish dashboards or conflict prompts

## Summary

Finance Ledger now has a real sync foundation: Drift remains the app-facing local database, PowerSync manages sync readiness on top of the same SQLite file, Supabase remains the backend source of truth, and the app can still run fully offline when the network or sync service is unavailable.
