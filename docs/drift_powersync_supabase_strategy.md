# Drift, PowerSync, and Supabase Strategy

## Purpose

This document explains how the current Finance Ledger architecture uses Drift, PowerSync, and Supabase together after the sync foundation phase.

## What Is Implemented Now

- Drift-based local persistence for ledger data
- Riverpod providers/controllers reading from Drift-backed state
- one-time seed and reset flows for real local workspaces
- explicit separation between ownership-ready business data and local-only operational data
- Supabase SDK setup in Flutter
- Supabase Auth for email/password with guarded future Google/phone entry points
- app-level profile storage in Supabase `public.profiles`
- PowerSync package and client initialization in Flutter
- auth-aware PowerSync connection lifecycle
- raw-table sync alignment for `accounts`, `categories`, `transactions`, `settings`, and `notification_preferences`
- derived dashboard and analytics calculations kept out of persisted source-of-truth tables

## What Is Explicitly Out of Scope Now

- final conflict-resolution UX and merge policies
- chatbot backend implementation
- full Google auth
- full phone auth
- advanced multi-device validation polish

## Current Architecture

```text
Flutter UI
-> Riverpod providers/controllers
-> Drift DAOs
-> SQLite on device
-> device services such as local notifications

Flutter UI
-> Riverpod auth/profile services
-> Supabase Auth
-> Supabase public.profiles
```

## Planned Future Architecture

```text
Flutter UI
-> Riverpod providers/controllers
-> Drift local database
-> PowerSync sync layer
-> Supabase / Postgres backend
```

`public.profiles` remains a direct Supabase auth/profile concern in this phase because it is part of the auth bootstrap path.

## Why Drift Still Matters After Adding Supabase

- It keeps the ledger fully usable offline.
- It avoids turning every screen into a network-dependent flow.
- It gives the app a stable local schema and migration path.
- It lets auth be introduced now without forcing ledger sync at the same time.
- It aligns well with a later PowerSync-on-SQLite approach.

## Syncability Classification

### Ownership-Ready Local Business Data

- accounts
- categories
- transactions
- settings
- notification preferences

### Local-Only Operational Data

- import records
- export records

### Active Remote Identity/Profile Data

- Supabase `auth.users`
- Supabase `public.profiles`

### Active Remote Syncable Business Data

- remote `accounts`
- remote `categories`
- remote `transactions`
- remote `settings`
- remote `notification_preferences`

### Derived Only

- dashboard summary
- analytics summary
- account current balances
- recent/recommended lists
- filter results

## Design Decisions That Support PowerSync Later

### Stable IDs

All persisted business entities use stable string identifiers instead of auto-increment IDs.

### Explicit Timestamps

Business entities store `createdAt` and `updatedAt`.

### Soft Delete Readiness

Syncable entities that are likely to need safe deletion later include nullable `deletedAt`.

### Relational Shape

Transactions reference accounts and categories explicitly.

### Source Records Stay Canonical

The app persists accounts, categories, transactions, and settings.
It does not persist dashboard totals or analytics summaries as canonical business state.

## Design Decisions That Support Supabase Now and Later

### Ownership-Ready Columns

Nullable `userId` columns exist on local syncable entities and are now actively aligned with the authenticated Supabase user id.

### Profile Separation

Supabase Auth owns authentication identity, while `public.profiles` owns app-level user data.
This keeps auth secrets out of app tables and matches how later ownership rules should evolve.

### Backend-Friendly Naming

Table and field names are already close to the expected Postgres model:

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`
- `profiles`

### Migration-Friendly Structure

The schema is explicit and versioned through Drift migrations rather than ad-hoc local storage.

## Riverpod Integration Strategy

The UI does not call Drift or Supabase directly.

Instead:

- providers expose app-facing state
- notifiers/controllers perform writes
- Drift watch streams feed provider state updates
- auth/profile services sit behind Riverpod providers

This keeps the UI decoupled from future sync engines and from low-level backend concerns.

## Workspace Safety Strategy Before Sync

Because sync is not implemented yet:

- the first authenticated user on a device can claim the local workspace
- new local business records are stamped with that authenticated user id
- if another user signs in on the same device before sync exists, the local workspace is reset

This prevents silent cross-account data leakage in the interim architecture.

## Notification Handling Strategy

Reminder preferences are persisted in Drift.
Device notification scheduling remains a separate side effect handled by `LocalNotificationService`.

This separation matters because:

- the preference may become syncable later
- the actual scheduled notification remains device-specific

## Future Integration Notes

### Active PowerSync Design

- keep Drift as the local read/write store
- sync only the classified business tables
- leave import/export history unsynced
- preserve provider APIs so widgets do not need large rewrites
- use composite remote ownership `(user_id, id)` so existing local IDs do not collide across users

## Summary

Finance Ledger now uses Supabase for identity and profiles, Drift for local-first business data, and PowerSync as the sync layer between the two. The architecture keeps the app usable offline while preparing authenticated multi-device continuity without another rewrite of the feature modules.
