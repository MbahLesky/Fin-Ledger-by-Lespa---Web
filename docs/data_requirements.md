# Data Requirements

*Finance Ledger Web*

## Overview

Finance Ledger Web now treats Supabase as the source of truth for shared business data. The web app is online-first for shared ledger reads and writes. Browser storage is allowed only for device/browser-specific data.

## Required Data Behavior

- authenticated users read their shared data from Supabase
- writes for accounts, categories, transactions, transfers, settings, profiles, and shared notification preferences go directly to Supabase
- Supabase Realtime keeps open web screens refreshed after backend changes
- rows are scoped to the authenticated user through RLS
- signed-out state must clear in-memory shared data
- switching users must not leak prior user records
- offline shared-data writes fail with clear feedback
- no local queue pretends to save shared records offline

## Shared Entities

### Profile

Purpose:

- app-level profile linked to Supabase Auth

Required:

- `id`
- `created_at`
- `updated_at`

Optional:

- `name`
- `email`
- `phone_number`
- `avatar_url`
- `onboarding_completed`
- `preferred_currency`

Validation:

- `id` must match the active authenticated user
- secrets are never stored in `profiles`

### Account

Purpose:

- user-owned money container

Required:

- `id`
- `user_id`
- `name`
- `type`
- `initial_balance`
- `currency_code`
- `is_default`
- `is_archived`
- `display_order`
- `created_at`
- `updated_at`

Optional:

- `deleted_at`

Validation:

- name is required
- type must be supported by the app
- default Cash and Bank are seeded when missing
- current balance is derived

### Category

Required:

- `id`
- `user_id`
- `name`
- `type`
- `is_system`
- `is_active`
- `created_at`
- `updated_at`

Optional:

- `icon_key`
- `color_key`
- `deleted_at`

Validation:

- type is `income` or `expense`
- category type must match transaction type

### Transaction

Required:

- `id`
- `user_id`
- `account_id`
- `category_id`
- `type`
- `amount`
- `transaction_date`
- `created_at`
- `updated_at`

Optional:

- `note`
- `reference`
- `deleted_at`

Validation:

- amount is greater than zero
- type is `income` or `expense`
- account and category must be valid for the current user

### Transfer

Required:

- `id`
- `user_id`
- `from_account_id`
- `to_account_id`
- `amount`
- `fee`
- `transfer_date`
- `created_at`
- `updated_at`

Optional:

- `note`
- `deleted_at`

Validation:

- source and destination accounts differ
- amount is greater than zero
- fee is zero or greater
- source balance must cover amount plus fee
- transfer amount does not count as income or expense

### Settings

Required:

- `id`
- `user_id`
- `currency_code`
- `theme_mode`
- `onboarding_complete`
- `created_at`
- `updated_at`

Validation:

- one settings row per user
- currency must be in the supported currency list

### Notification Preference

Required:

- `id`
- `user_id`
- `enabled`
- `timing_mode`
- `created_at`
- `updated_at`

Optional:

- `reminder_time`

Rules:

- shared preference state is stored in Supabase
- browser permission and delivery capability remain local/device-specific

## Local-Only Data Requirements

Allowed local-only data:

- import history
- export history
- current file preview state
- import mapping state before confirmation
- dismissed tips or future tutorial state
- browser notification permission state
- transient UI filters

Not allowed as local-only source data:

- accounts
- categories
- transactions
- transfers
- profiles
- settings
- shared notification preferences

## CSV Import Requirements

Required columns:

- `date`
- `type`
- `amount`
- `account`

Optional columns:

- `category`
- `note`

Behavior:

- preview before committing
- show invalid rows
- map or create accounts/categories
- write valid confirmed rows directly to Supabase
- store import history locally only

## CSV Export Requirements

- export active Supabase transactions for the signed-in user
- use columns `date,type,amount,category,account,note`
- generate the file in the browser
- store export history locally only

## Derived Data

The following are derived from backend source tables:

- dashboard totals
- account current balances
- recent activity
- analytics totals
- monthly trends
- category breakdowns

## Realtime Requirements

- subscribe once per signed-in user
- filter table changes by user ownership
- clean up subscriptions on logout/user change
- refetch backend queries after realtime events
- show reconnect/offline state without suggesting an offline queue exists

## Summary

The data model is now backend-first for shared records and local-only for device operational traces. This supports web/mobile continuity for the same authenticated user without relying on the removed sync layer.
