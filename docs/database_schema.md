# Database Schema Specification

*Finance Ledger - Supabase Source-of-Truth Schema*

## Purpose

This document defines the current data model for Finance Ledger Web. Shared business data is stored in Supabase PostgreSQL and protected by Supabase Auth/RLS. The web app no longer keeps a local business-data schema or local mutation queue.

## Table Classification

### Supabase Auth

- `auth.users`

### Shared Supabase Tables

- `public.profiles`
- `public.accounts`
- `public.categories`
- `public.transactions`
- `public.transfers`
- `public.settings`
- `public.notification_preferences`

### Local-Only Browser Data

- CSV import history
- CSV export history
- temporary import preview/mapping state
- browser notification permission state
- transient UI preferences and filters

No local table stores accounts, categories, transactions, transfers, shared settings, or shared notification preferences as the source of truth.

## Common Shared-Record Rules

- all business tables include `user_id`
- RLS policies enforce `user_id = auth.uid()`
- profile ownership uses `profiles.id = auth.uid()`
- soft-delete capable tables use `deleted_at`
- client-generated text ids are scoped by `(user_id, id)`
- `updated_at` is maintained by database trigger
- dashboard and analytics are derived, not persisted
- new shared row ids created by the web app are plain UUID strings, even when a live table accepts text ids

## Tables

### `public.profiles`

Purpose:

- app-level profile tied to a Supabase Auth user

Fields:

- `id UUID PRIMARY KEY REFERENCES auth.users(id)`
- `name TEXT NULL`
- `email TEXT NULL`
- `phone_number TEXT NULL`
- `avatar_url TEXT NULL`
- `onboarding_completed BOOLEAN NOT NULL DEFAULT false`
- `preferred_currency TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Rules:

- one row per authenticated user
- not used for passwords, refresh tokens, or auth secrets

### `public.accounts`

Purpose:

- user-owned money containers such as Cash, Bank, Mobile Money, Wallet, Savings, and Other

Fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL REFERENCES auth.users(id)`
- `name TEXT NOT NULL`
- `type TEXT NOT NULL`
- `initial_balance NUMERIC NOT NULL DEFAULT 0`
- `currency_code TEXT NOT NULL`
- `is_default BOOLEAN NOT NULL DEFAULT false`
- `is_archived BOOLEAN NOT NULL DEFAULT false`
- `display_order INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `deleted_at TIMESTAMPTZ NULL`
- primary key: `(user_id, id)`

Rules:

- a user may own multiple account rows; `user_id` must not be unique by itself
- default accounts are identified by account metadata, not deterministic text ids
- current balance is derived from `initial_balance`, transactions, transfers, and fees

### `public.categories`

Purpose:

- income and expense classification

Fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL REFERENCES auth.users(id)`
- `name TEXT NOT NULL`
- `type TEXT NOT NULL`
- `icon_key TEXT NULL`
- `color_key TEXT NULL`
- `is_system BOOLEAN NOT NULL DEFAULT false`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `deleted_at TIMESTAMPTZ NULL`
- primary key: `(user_id, id)`

Rules:

- web-seeded default categories are user-owned rows with `is_system = false`
- `is_system = true` is reserved for backend/global system rows if the live schema supports them
- custom categories may be created during settings or CSV import mapping

### `public.transactions`

Purpose:

- income and expense ledger records

Fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL REFERENCES auth.users(id)`
- `account_id TEXT NOT NULL`
- `category_id TEXT NOT NULL`
- `type TEXT NOT NULL`
- `amount NUMERIC NOT NULL`
- `note TEXT NOT NULL DEFAULT ''`
- `transaction_date TIMESTAMPTZ NOT NULL`
- `reference TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `deleted_at TIMESTAMPTZ NULL`
- primary key: `(user_id, id)`

Rules:

- amount must be positive
- type is `income` or `expense`
- `reference` may preserve CSV import source information
- soft delete removes rows from active history without immediately losing audit context

### `public.transfers`

Purpose:

- account-to-account movement that does not count as income or expense

Fields:

- `id TEXT NOT NULL`
- `user_id UUID NOT NULL REFERENCES auth.users(id)`
- `from_account_id TEXT NOT NULL`
- `to_account_id TEXT NOT NULL`
- `amount NUMERIC NOT NULL CHECK (amount > 0)`
- `fee NUMERIC NOT NULL DEFAULT 0 CHECK (fee >= 0)`
- `note TEXT NOT NULL DEFAULT ''`
- `transfer_date TIMESTAMPTZ NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `deleted_at TIMESTAMPTZ NULL`
- primary key: `(user_id, id)`

Rules:

- source and destination accounts must differ
- transfer amount is excluded from income/expense totals
- fees reduce the source account and contribute to expense-side analytics

### `public.settings`

Purpose:

- user-level app settings that should follow the account across web and mobile

Fields:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES auth.users(id)`
- `currency_code TEXT NOT NULL`
- `theme_mode TEXT NOT NULL`
- `onboarding_complete BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- unique key: `user_id`

Rules:

- one canonical settings row is maintained per user
- the web app treats `id` as an opaque backend row id and never writes deterministic ids such as `app-settings`
- route guards primarily use `profiles.onboarding_completed`, while settings keep app preferences

### `public.notification_preferences`

Purpose:

- shared user-level reminder preferences

Fields:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES auth.users(id)`
- `enabled BOOLEAN NOT NULL DEFAULT false`
- `reminder_time TEXT NULL`
- `timing_mode TEXT NOT NULL DEFAULT 'daily'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- unique key: `user_id`

Rules:

- preference state is shared
- the web app treats `id` as an opaque backend row id and never writes deterministic ids such as `notification-preferences`
- actual browser permission and delivery capability remain device-specific

## Realtime Targets

The web app subscribes to:

- `profiles` filtered by `id`
- `accounts`
- `categories`
- `transactions`
- `transfers`
- `settings`
- `notification_preferences`

Business-table realtime filters use `user_id=eq.<active-user-id>`.

## Removed Local Schema

The prior local business schema, mutation outbox, pull checkpoints, and sync metadata are removed from the web app. There are no `remote_id`, `sync_status`, `sync_error`, or `last_synced_at` fields in the current TypeScript business entities.

## Summary

Supabase PostgreSQL is now the canonical database for shared Finance Ledger records. Browser storage is intentionally limited to local-only operational history and transient UI state.
