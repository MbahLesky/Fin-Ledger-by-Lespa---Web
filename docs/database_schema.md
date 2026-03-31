# Database Schema Specification

*Finance Ledger - Drift Local Schema, PowerSync Raw Tables, and Supabase Remote Tables*

## Purpose

This document defines the current schema boundaries for Finance Ledger after PowerSync was introduced.

Goals:

- keep ledger data durable and offline-first through Drift
- add PowerSync as the sync layer on the same SQLite database
- add real authenticated identity through Supabase
- keep source financial data relational and migration-friendly
- separate local operational history from ownership-ready business data
- keep summaries derived instead of stored

## Current Architecture

```text
Flutter UI
-> Riverpod state
-> Drift DAOs for ledger data
-> SQLite on device
-> PowerSync sync layer
-> Supabase / Postgres

Flutter UI
-> Riverpod auth/profile services
-> Supabase Auth + public.profiles
```

`public.profiles` remains part of the direct auth/profile flow.

## Table Classification

### Local Ownership-Ready Business Tables

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

### Local-Only Operational Tables

- `import_records`
- `export_records`

### Remote Supabase Auth Foundation

- `auth.users` (managed by Supabase)
- `public.profiles` (managed by Finance Ledger)

### Remote Supabase Ledger Tables

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

## Table Definitions

### Local: `accounts`

Purpose:

- stores default accounts and user-created accounts

Key fields:

- `id` TEXT PK
- `user_id` TEXT NULL
- `name` TEXT NOT NULL
- `type` TEXT NOT NULL
- `initial_balance` REAL NOT NULL DEFAULT `0`
- `currency_code` TEXT NOT NULL
- `is_default` BOOLEAN NOT NULL DEFAULT `false`
- `is_archived` BOOLEAN NOT NULL DEFAULT `false`
- `display_order` INTEGER NOT NULL DEFAULT `0`
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL
- `deleted_at` DATETIME NULL

Rules:

- `default-cash` and `default-bank` are controlled defaults
- current balance is derived from `initial_balance` plus transactions
- new or reassigned records may be stamped with the authenticated Supabase user id
- PowerSync syncs this table through a raw-table mapping into the same local SQLite table

### Local: `categories`

Purpose:

- stores system and custom categories for income and expense classification

Key fields:

- `id` TEXT PK
- `user_id` TEXT NULL
- `name` TEXT NOT NULL
- `type` TEXT NOT NULL
- `icon_key` TEXT NULL
- `color_key` TEXT NULL
- `is_system` BOOLEAN NOT NULL DEFAULT `false`
- `is_active` BOOLEAN NOT NULL DEFAULT `true`
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL
- `deleted_at` DATETIME NULL

Rules:

- system categories are inserted once during initialization
- custom categories may be created from category management or CSV import mapping
- PowerSync syncs this table through a raw-table mapping into the same local SQLite table

### Local: `transactions`

Purpose:

- stores income and expense records as the ledger source of truth

Key fields:

- `id` TEXT PK
- `user_id` TEXT NULL
- `account_id` TEXT NOT NULL FK -> `accounts.id`
- `category_id` TEXT NOT NULL FK -> `categories.id`
- `type` TEXT NOT NULL
- `amount` REAL NOT NULL
- `note` TEXT NOT NULL DEFAULT `''`
- `transaction_date` DATETIME NOT NULL
- `reference` TEXT NULL
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL
- `deleted_at` DATETIME NULL

Rules:

- amount is stored as a positive number
- `reference` may capture source metadata such as `Imported from records.csv`
- legacy columns like `source` are no longer part of the current schema
- PowerSync syncs this table through a raw-table mapping into the same local SQLite table

### Local: `settings`

Purpose:

- stores stable app preferences and onboarding completion

Key fields:

- `id` TEXT PK
- `user_id` TEXT NULL
- `currency_code` TEXT NOT NULL
- `theme_mode` TEXT NOT NULL
- `onboarding_complete` BOOLEAN NOT NULL DEFAULT `false`
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL

Rules:

- one canonical row is maintained
- the authenticated user id may be attached for future ownership alignment
- remote sync uses the same local `id` but pairs it with `user_id` in Postgres to avoid cross-user collisions

### Local: `notification_preferences`

Purpose:

- stores reminder preferences separately from general settings

Key fields:

- `id` TEXT PK
- `user_id` TEXT NULL
- `enabled` BOOLEAN NOT NULL DEFAULT `false`
- `reminder_time` TEXT NULL
- `timing_mode` TEXT NOT NULL
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL

### Local: `import_records`

Purpose:

- keeps a local history of CSV import attempts that were confirmed by the user

Key fields:

- `id` TEXT PK
- `file_name` TEXT NOT NULL
- `format` TEXT NOT NULL
- `total_records` INTEGER NOT NULL
- `successful_records` INTEGER NOT NULL
- `failed_records` INTEGER NOT NULL
- `status` TEXT NOT NULL
- `error_summary` TEXT NOT NULL DEFAULT `''`
- `created_at` DATETIME NOT NULL

Rules:

- local-only
- not a source financial record

### Local: `export_records`

Purpose:

- keeps a local history of generated CSV exports

Key fields:

- `id` TEXT PK
- `format` TEXT NOT NULL
- `record_count` INTEGER NOT NULL
- `filters_applied` TEXT NOT NULL
- `file_name` TEXT NOT NULL
- `created_at` DATETIME NOT NULL

Rules:

- local-only
- not a source financial record

### Remote: `public.profiles`

Purpose:

- stores the Finance Ledger app-level user profile separately from Supabase Auth system tables

Key fields:

- `id` UUID PK FK -> `auth.users.id`
- `name` TEXT NULL
- `email` TEXT NULL
- `phone_number` TEXT NULL
- `avatar_url` TEXT NULL
- `onboarding_completed` BOOLEAN NOT NULL DEFAULT `false`
- `preferred_currency` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

Rules:

- one row per authenticated Supabase user
- created or updated after successful authenticated email/password entry in this phase
- protected by RLS so a user can only access their own row
- email is expected for the current email/password flow, while `phone_number` may remain null until later profile edits or future auth methods are enabled

### Remote: `auth.users`

Purpose:

- system-managed Supabase identity table

Rules:

- not owned by Finance Ledger migration code except through Supabase Auth flows
- source of the authenticated user UUID used by `public.profiles.id` and future remote ownership rules

## Remote Ledger Table Notes

Remote ledger tables preserve the existing local IDs instead of forcing a full local ID rewrite.

Because some local IDs are intentionally stable constants such as:

- `default-cash`
- `default-bank`
- `app-settings-primary`

the remote business tables use user-scoped ownership as part of the row identity:

- composite remote identity: `(user_id, id)`
- PowerSync sync streams still expose the existing local `id` value back to the client
- this keeps the local app behavior stable while avoiding cross-user collisions in Supabase

## Initialization and Ownership Rules

- first run inserts default settings, default accounts, and system categories
- initialization is idempotent
- transactions are never seeded
- import/export history starts empty
- the first authenticated user on a device can claim the local workspace
- if a different authenticated user signs in before sync exists, the local workspace is reset and reseeded to avoid data leakage
- after PowerSync integration, existing local syncable rows are also queued once for initial upload readiness

## Import / Export Schema Notes

- CSV import creates `transactions` plus optional new `accounts` and `categories`
- imported business records can be stamped with the current authenticated `user_id`
- CSV export reads from `transactions` and writes only to `export_records`
- import and export history do not replace or duplicate business records

## Derived Data

The following stay derived from business tables:

- dashboard totals
- analytics summaries
- account current balances
- recent activity lists

## Summary

The current schema now has four clear layers: local ledger data in Drift, PowerSync raw-table synchronization over that same SQLite database, local operational import/export history, and remote Supabase identity plus business tables. The app keeps its local-first behavior while the business records are now structured to sync safely per authenticated user.
