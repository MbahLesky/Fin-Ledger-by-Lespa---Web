# Data Requirements

*Finance Ledger*

## Overview

This document defines the current data requirements for Finance Ledger after PowerSync was introduced on March 27, 2026.

Current implementation direction:

- Flutter + Riverpod for UI and application state
- Drift + SQLite for local ledger persistence
- PowerSync for sync-ready local-first synchronization
- Supabase Auth for sign-in and session restore
- Supabase `public.profiles` for app-level user data
- remote ledger tables prepared in Supabase/Postgres

## Current Product Data Behavior

- settings drive onboarding completion, theme, and preferred currency
- accounts store opening balances and stay separate from transactions
- categories classify transactions and support both system defaults and user-created items
- transactions are the financial source of truth for dashboard and analytics
- import and export history are stored locally for traceability
- Supabase stores identity, app-level profile information, and remote syncable ledger records
- dashboard and analytics remain derived, not persisted as summary tables
- PowerSync sits between the local Drift database and the remote Supabase/Postgres ledger tables

## Entity Overview

### Profile

**Purpose**

- stores the app-level user record tied to a Supabase-authenticated identity
- keeps display and onboarding metadata separate from Supabase system auth tables

**Required fields**

- `id`
- `created_at`
- `updated_at`

**Optional fields**

- `name`
- `email`
- `phone_number`
- `avatar_url`
- `onboarding_completed`
- `preferred_currency`

**Validation**

- `id` must match the authenticated Supabase user id
- no duplicate profile rows are allowed
- email or phone may be absent depending on the auth method
- auth secrets must never be stored in this table

### Account

**Purpose**

- represents Cash, Bank, MoMo, Savings, and other user-facing money containers
- supports onboarding balances and import account mapping

**Required fields**

- `id`
- `name`
- `type`
- `initial_balance`
- `currency_code`
- `is_default`
- `is_archived`
- `display_order`
- `created_at`
- `updated_at`

**Optional fields**

- `user_id`
- `deleted_at`

**Validation**

- name must not be empty
- default accounts `Cash` and `Bank` must remain available
- imported accounts may be matched to existing records or created during import

### Category

**Purpose**

- classifies transactions into income and expense groups
- supports system defaults and user-created categories

**Required fields**

- `id`
- `name`
- `type`
- `is_system`
- `is_active`
- `created_at`
- `updated_at`

**Optional fields**

- `user_id`
- `icon_key`
- `color_key`
- `deleted_at`

**Validation**

- name must not be empty
- type must be `income` or `expense`
- imported categories must align with the transaction type

### Transaction

**Purpose**

- stores each income and expense record
- powers dashboard totals, account balances, history, filters, and analytics

**Required fields**

- `id`
- `account_id`
- `category_id`
- `type`
- `amount`
- `transaction_date`
- `created_at`
- `updated_at`

**Optional fields**

- `user_id`
- `note`
- `reference`
- `deleted_at`

**Validation**

- amount must be numeric and greater than zero
- type must be `income` or `expense`
- account must exist
- category must exist and be type-compatible
- `reference` may preserve origin metadata such as CSV import source

### Settings

**Purpose**

- stores stable app preferences and onboarding completion

**Required fields**

- `id`
- `currency_code`
- `theme_mode`
- `onboarding_complete`
- `created_at`
- `updated_at`

**Optional fields**

- `user_id`

**Validation**

- one canonical settings row should exist
- currency must be supported by the app
- onboarding completion controls first-run routing

### Notification Preference

**Purpose**

- stores reminder preferences separately from general settings

**Required fields**

- `id`
- `enabled`
- `timing_mode`
- `created_at`
- `updated_at`

**Optional fields**

- `user_id`
- `reminder_time`

### Import Record

**Purpose**

- stores local audit history for completed or failed CSV imports

**Required fields**

- `id`
- `file_name`
- `format`
- `total_records`
- `successful_records`
- `failed_records`
- `status`
- `error_summary`
- `created_at`

**Behavior**

- created only when an import is confirmed and processed
- local-only and not part of future syncable business data

### Export Record

**Purpose**

- stores local audit history for generated CSV exports

**Required fields**

- `id`
- `format`
- `record_count`
- `filters_applied`
- `file_name`
- `created_at`

## Authentication and Ownership Requirements

- the app must support email/password through Supabase in the current phase
- the app must keep Google and phone auth visible in the UI while guarding them with coming-soon feedback instead of broken flows
- the app must restore valid sessions on launch
- a `public.profiles` row must exist after first successful authentication
- local business records should be stamped with the authenticated user id when available
- a different user signing into the same device before sync exists must not inherit another user's local ledger data
- PowerSync must only connect with an authenticated Supabase session
- syncable remote rows must remain owned by `user_id = auth.uid()`

## Sync Classification

### Syncable business records

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

### Direct auth/profile remote record

- `public.profiles`

### Local-only operational records

- `import_records`
- `export_records`

### Derived-only records

- dashboard totals
- analytics summaries
- computed balances
- recent activity summaries

## CSV Import Requirements

### Supported Format

Required columns:

- `date`
- `type`
- `amount`
- `account`

Optional columns:

- `category`
- `note`

Supported values:

- `date` uses `YYYY-MM-DD`
- `type` uses `income` or `expense`
- `amount` is numeric and greater than zero
- `account` is plain text
- `category` is plain text when provided
- `note` is optional plain text

### Validation and Handling

- fully empty rows are ignored
- missing required headers block import confirmation
- malformed rows are shown in preview and skipped
- exact duplicates inside the same file are skipped conservatively
- likely duplicates against existing local records may be skipped conservatively
- valid rows can still import even when some rows fail

### Mapping Rules

- account name matches use case-insensitive normalized comparison
- unknown accounts can be mapped to an existing account or created as new local accounts
- category name matches use normalized comparison plus transaction type
- unknown categories can be mapped to an existing category or created as new local categories
- blank categories must be mapped before import because stored transactions require a category

## CSV Export Requirements

- exports all transactions for the current local workspace
- uses columns `date,type,amount,category,account,note`
- output should be spreadsheet-friendly and re-importable later
- export is local-only and handed off through the mobile share/save flow

## Derived Data

The following remain derived instead of persisted as source-of-truth tables:

- dashboard totals
- analytics summaries
- current balances
- recent activity summaries

## Future-Readiness

- local business tables already carry `user_id` for ownership alignment
- profile ownership is anchored to Supabase `auth.uid()`
- timestamps remain present for migration and later sync readiness
- import/export logic stays append-first and local-first and remains excluded from PowerSync source-of-truth syncing
- remote ledger tables now preserve the local app IDs while using user ownership to avoid cross-user collisions
- PowerSync raw tables allow Drift to stay the local data API without rewriting feature modules

## Summary

Finance Ledger now has three complementary data layers: local ledger data in Drift, a PowerSync sync layer over the same SQLite database, and remote identity/profile plus ledger data in Supabase. The app remains offline-first, while authenticated ownership and sync readiness are now real instead of only planned.
