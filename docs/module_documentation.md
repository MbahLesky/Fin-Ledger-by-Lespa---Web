# Module Documentation

*Finance Ledger Web*

## Introduction

This document describes the current web modules after the sync-layer removal. The app keeps the same product capabilities, but shared business data now goes directly through Supabase.

## Core Principles

- React pages stay presentation-focused.
- Repositories and services own Supabase access.
- Supabase is the source of truth for shared business data.
- Supabase Realtime invalidates backend queries after changes.
- Browser storage is reserved for local-only device data.
- Shared-data writes are online-first and must surface failures.

## Module Overview

| Module | Purpose |
| --- | --- |
| Authentication | Email auth, session restore, profile completion, guarded future auth entry points, and sign-out |
| Backend Integration | Supabase client setup, direct CRUD repositories, profile service, and realtime subscriptions |
| Realtime State | Connection status, backend event revision, and query invalidation signals |
| Onboarding | Currency choice, optional import, opening balances, reminder setup, and backend default seeding |
| Accounts | Default/custom account management and balance derivation from backend records |
| Categories | Default/custom category management and type-aware transaction classification |
| Transactions | Create, edit, soft-delete, filter, and fetch income/expense records from Supabase |
| Transfers | Move funds between accounts without classifying transfer amount as income/expense |
| Dashboard | Derived balances, totals, accounts, and recent activity from backend source tables |
| Analytics | Derived charts and trends from backend transactions and transfer fees |
| Import/Export | CSV parsing, validation, mapping, Supabase commit/export, and local browser audit history |
| Settings | Shared settings, reminders, reset flow, profile/session controls, and local-only history entry points |
| Browser Services | PWA shell caching, notification permissions, file upload/download, and install prompt support |

## Data Modules

### Shared Backend Repositories

The repository modules in `src/db/repositories/` remain the application-facing data layer, but they now call Supabase directly:

- `accounts-repository.ts`
- `categories-repository.ts`
- `transactions-repository.ts`
- `transfers-repository.ts`
- `settings-repository.ts`
- `dashboard-repository.ts`
- `history-repository.ts`
- `workspace-repository.ts`

These repositories:

- read the active user's rows from Supabase
- write with the authenticated `user_id`
- rely on RLS for ownership enforcement
- trigger local realtime invalidation after successful local writes
- throw user-safe errors when the backend write fails

### Profile Service

`profile-service.ts` owns the direct `public.profiles` integration:

- ensure profile after auth
- read profile for the active user
- update app-level profile fields
- mirror onboarding and preferred currency metadata where needed

### Realtime Service

`ledger-realtime-service.ts` opens one Supabase Realtime channel per signed-in user and subscribes to shared tables. It updates `realtime-store.ts`, which causes `useBackendQuery` consumers to refetch.

### Local-Only Audit Repository

`audit-repository.ts` stores import/export history in browser local storage. This history is operational only and never becomes the source of truth for ledger records.

## Feature Modules

### Authentication

- restores Supabase sessions
- ensures `public.profiles`
- seeds backend defaults for settings, accounts, and categories
- cleans in-memory state on sign-out

### Onboarding

- writes currency, balances, reminders, and onboarding completion to Supabase
- can import CSV data directly into backend records
- uses profile metadata for route decisions

### Accounts

- ensures default Cash and Bank accounts for each user
- stores custom accounts in Supabase
- derives current balances from opening balance plus transactions and transfers

### Categories

- ensures user-owned default income/expense categories for each user
- stores custom categories in Supabase
- soft-removes user categories with `deleted_at` and inactive state

### Transactions

- writes income/expense rows directly to Supabase
- updates and soft-deletes backend rows
- joins account/category labels in repository output for UI consumption

### Transfers

- validates source/destination account rules
- validates available source balance before backend insert
- keeps transfer amount separate from income/expense totals
- includes fees in expense-side analytics

### Dashboard and Analytics

- derive summaries from backend source rows
- do not persist summary tables
- refresh when realtime events are received

### Import/Export

- import preview and mapping remain transient UI state
- confirmed imports create backend accounts, categories, and transactions
- export reads active backend transactions
- import/export history stays local-only

## Removed Module

The previous sync module is removed from the web app:

- no outbox
- no sync status store
- no sync engine
- no Dexie business-data source
- no "write locally and sync later" behavior

## Summary

Finance Ledger Web modules now align around direct Supabase access, auth-scoped ownership, and realtime refresh. The UI keeps its existing feature flow while the data layer is simpler and shared across web and mobile.
