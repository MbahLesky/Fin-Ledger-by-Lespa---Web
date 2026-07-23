# Database Schema Specification

*Monilog - Local IndexedDB Schema and Supabase PostgreSQL Schema*

## Purpose

This document defines the data boundaries for Monilog as an offline-first web application.

Goals:

- keep ledger data durable and usable offline through IndexedDB
- preserve the same finance entities and business rules already defined for the product
- synchronize eligible records to Supabase/PostgreSQL when connectivity is available
- separate local operational history from syncable business records
- keep dashboard and analytics views derived instead of stored as canonical summary tables

## Current Architecture

```text
React UI
-> Zustand stores and feature services
-> Dexie repositories
-> IndexedDB local tables
-> sync outbox
-> Supabase / PostgreSQL

React auth pages
-> Supabase Auth
-> public.profiles
```

## Table Classification

### Local Syncable Business Tables

- `accounts`
- `categories`
- `transactions`
- `transfers`
- `settings`
- `notification_preferences`

### Local Operational Tables

- `import_records`
- `export_records`
- `sync_operations`

### Remote Supabase Auth Foundation

- `auth.users`
- `public.profiles`

### Remote Supabase Ledger Tables

- `accounts`
- `categories`
- `transactions`
- `transfers`
- `settings`
- `notification_preferences`

## Local IndexedDB Record Shape

Each syncable local record should include domain fields plus sync metadata.

Common metadata fields:

- `id` TEXT PK
- `remote_id` TEXT NULL
- `user_id` TEXT NULL
- `sync_status` TEXT NOT NULL DEFAULT `pending`
- `sync_error` TEXT NULL
- `last_synced_at` DATETIME NULL
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL
- `deleted_at` DATETIME NULL

`sync_status` values:

- `pending`
- `synced`
- `failed`

`remote_id` behavior:

- if the remote table reuses the client-generated `id`, `remote_id` may mirror `id` after the first successful sync
- if the remote layer assigns a different identifier, `remote_id` stores that mapping explicitly

## Table Definitions

### Local: `accounts`

Purpose:

- stores default accounts and user-created money containers

Key fields:

- `id`
- `remote_id`
- `user_id`
- `name`
- `type`
- `initial_balance`
- `currency_code`
- `is_default`
- `is_archived`
- `display_order`
- `sync_status`
- `sync_error`
- `last_synced_at`
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- `default-cash` and `default-bank` remain controlled defaults
- current balance is derived from `initial_balance` plus transactions and transfers
- local writes are immediate, even while offline

### Local: `categories`

Purpose:

- stores system and custom categories for income and expense classification

Key fields:

- `id`
- `remote_id`
- `user_id`
- `name`
- `type`
- `icon_key`
- `color_key`
- `is_system`
- `is_active`
- `sync_status`
- `sync_error`
- `last_synced_at`
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- system categories are inserted once during initialization
- custom categories may be created from category management or CSV import mapping

### Local: `transactions`

Purpose:

- stores income and expense records as the ledger source of truth

Key fields:

- `id`
- `remote_id`
- `user_id`
- `account_id`
- `category_id`
- `type`
- `amount`
- `note`
- `transaction_date`
- `reference`
- `sync_status`
- `sync_error`
- `last_synced_at`
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- amount is stored as a positive number
- `reference` may capture source metadata such as `Imported from records.csv`
- soft delete is preferred so offline and remote reconciliation can remain consistent

### Local: `transfers`

Purpose:

- stores account-to-account transfer records without classifying transfer amount as income or expense

Key fields:

- `id`
- `remote_id`
- `user_id`
- `from_account_id`
- `to_account_id`
- `amount`
- `fee`
- `note`
- `transfer_date`
- `sync_status`
- `sync_error`
- `last_synced_at`
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- transfer amount is stored as a positive number
- fee is stored as zero or a positive number
- `from_account_id` and `to_account_id` must be different
- source account balance must cover `amount + fee`
- transfer amount does not count as income or expense

### Local: `settings`

Purpose:

- stores stable app preferences and onboarding completion

Key fields:

- `id`
- `remote_id`
- `user_id`
- `currency_code`
- `theme_mode`
- `onboarding_complete`
- `sync_status`
- `sync_error`
- `last_synced_at`
- `created_at`
- `updated_at`

Rules:

- one canonical settings row is maintained per local workspace
- remote sync pairs the row with authenticated ownership

### Local: `notification_preferences`

Purpose:

- stores reminder preferences separately from general settings

Key fields:

- `id`
- `remote_id`
- `user_id`
- `enabled`
- `reminder_time`
- `timing_mode`
- `sync_status`
- `sync_error`
- `last_synced_at`
- `created_at`
- `updated_at`

Rules:

- the record stores preference state, not delivery guarantees
- browser-specific delivery constraints are handled at the service layer

### Local: `import_records`

Purpose:

- keeps a local history of CSV import attempts confirmed by the user

Key fields:

- `id`
- `file_name`
- `format`
- `total_records`
- `successful_records`
- `failed_records`
- `status`
- `error_summary`
- `created_at`

Rules:

- local-only
- not a source financial record

### Local: `export_records`

Purpose:

- keeps a local history of generated CSV exports

Key fields:

- `id`
- `format`
- `record_count`
- `filters_applied`
- `file_name`
- `created_at`

Rules:

- local-only
- not a source financial record

### Local: `sync_operations`

Purpose:

- records outbox entries, pull checkpoints, and sync failures for the browser client

Key fields:

- `id`
- `entity_name`
- `entity_id`
- `operation`
- `status`
- `payload`
- `error_message`
- `retry_count`
- `last_attempted_at`
- `created_at`
- `updated_at`

Rules:

- used by the sync engine, not by reporting
- remains local-only operational state

### Remote: `public.profiles`

Purpose:

- stores the Monilog app-level user profile separately from Supabase Auth system tables

Key fields:

- `id UUID PRIMARY KEY`
- `name TEXT NULL`
- `email TEXT NULL`
- `phone_number TEXT NULL`
- `avatar_url TEXT NULL`
- `onboarding_completed BOOLEAN NOT NULL DEFAULT false`
- `preferred_currency TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Rules:

- one row per authenticated Supabase user
- protected by RLS so a user can access only their own row

### Remote: `accounts`

Purpose:

- stores synced account records for authenticated continuity

Key fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL`
- `name TEXT NOT NULL`
- `type TEXT NOT NULL`
- `initial_balance NUMERIC NOT NULL DEFAULT 0`
- `currency_code TEXT NOT NULL`
- `is_default BOOLEAN NOT NULL DEFAULT false`
- `is_archived BOOLEAN NOT NULL DEFAULT false`
- `display_order INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `deleted_at TIMESTAMPTZ NULL`

Rules:

- unique identity should be enforced by `(user_id, id)`
- seeded IDs such as `default-cash` and `default-bank` remain safe because ownership scopes them per user

### Remote: `categories`

Key fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL`
- `name TEXT NOT NULL`
- `type TEXT NOT NULL`
- `icon_key TEXT NULL`
- `color_key TEXT NULL`
- `is_system BOOLEAN NOT NULL DEFAULT false`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `deleted_at TIMESTAMPTZ NULL`

### Remote: `transactions`

Key fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL`
- `account_id TEXT NOT NULL`
- `category_id TEXT NOT NULL`
- `type TEXT NOT NULL`
- `amount NUMERIC NOT NULL`
- `note TEXT NOT NULL DEFAULT ''`
- `transaction_date TIMESTAMPTZ NOT NULL`
- `reference TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `deleted_at TIMESTAMPTZ NULL`

### Remote: `transfers`

Key fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL`
- `from_account_id TEXT NOT NULL`
- `to_account_id TEXT NOT NULL`
- `amount NUMERIC NOT NULL`
- `fee NUMERIC NOT NULL DEFAULT 0`
- `note TEXT NOT NULL DEFAULT ''`
- `transfer_date TIMESTAMPTZ NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `deleted_at TIMESTAMPTZ NULL`

### Remote: `settings`

Key fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL`
- `currency_code TEXT NOT NULL`
- `theme_mode TEXT NOT NULL`
- `onboarding_complete BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### Remote: `notification_preferences`

Key fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL`
- `enabled BOOLEAN NOT NULL DEFAULT false`
- `reminder_time TEXT NULL`
- `timing_mode TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

## Initialization and Ownership Rules

- first run inserts default settings, default accounts, and system categories
- initialization is idempotent
- transactions are never seeded
- transfers are never seeded
- import/export history starts empty
- authenticated ownership is attached to syncable rows when a session exists
- rows remain usable locally even before a remote sync succeeds

## Sync Notes

- syncable rows are written locally first
- the outbox records create, update, and delete intents
- pull reconciliation should use `updated_at` and `deleted_at`
- failed remote writes do not erase local data
- local-only tables are excluded from remote sync

## Import / Export Notes

- CSV import creates `transactions` plus optional new `accounts` and `categories`
- imported business records enter the same local-first sync path as manual entries
- CSV export reads from local source tables and writes only to `export_records`

## Derived Data

The following stay derived from business tables:

- dashboard totals
- analytics summaries
- account current balances
- recent activity lists

## Summary

The schema now has three clear layers: local IndexedDB source data, local operational sync history, and remote Supabase continuity tables. The product behavior remains the same with transfers added as a first-class ledger entity aligned to offline-first web application behavior.
