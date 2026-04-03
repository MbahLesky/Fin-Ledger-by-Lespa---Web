# Dexie and Supabase Sync Strategy

*Finance Ledger - Offline-First Web Sync Strategy*

## Purpose

This document explains how Finance Ledger uses Dexie, IndexedDB, and Supabase together in the web version of the product.

## Core Strategy

Finance Ledger keeps the ledger local-first.

The browser runtime works like this:

- React UI captures user actions
- validated actions write to Dexie immediately
- local writes update the visible UI at once
- a sync engine pushes eligible changes to Supabase when the session and network are available
- remote changes are pulled back into Dexie for continuity

## Runtime Flow

```text
React UI
-> feature services
-> Dexie repositories
-> IndexedDB local tables
-> sync outbox
-> Supabase Postgres
```

## Why Dexie Still Matters After Adding Supabase

Dexie remains important because it:

- gives the app a durable offline-first source of truth
- keeps transaction entry fast even with weak connectivity
- supports import, export, onboarding, and analytics without remote dependency
- provides deterministic local schema control for the web client

Supabase still matters because it:

- handles identity and authenticated ownership
- stores remote profile and ledger continuity data
- enables future multi-device use

## Sync Design

### Local-first writes

- accounts, categories, transactions, settings, and reminder preferences write to Dexie first
- each successful local write updates `sync_status`
- each successful local write creates or refreshes an outbox entry

### Push behavior

- sync starts only when the user is authenticated and the browser is online
- pending records are pushed to Supabase in a safe order
- soft-deleted records push tombstone state through `deleted_at`

### Pull behavior

- the client tracks a pull checkpoint or latest known server timestamp
- changed remote rows are fetched and reconciled into Dexie
- incoming rows update local `last_synced_at` and `sync_status`

### Failure behavior

- failed writes stay local
- `sync_status` becomes `failed`
- `sync_error` stores a user-safe or developer-useful summary
- retries happen automatically on reconnect and can also be user-triggered

## Conflict Model

MVP policy:

- row ownership remains scoped by `user_id`
- `updated_at` is required on syncable entities
- last-write-wins is the default row-level conflict rule
- destructive changes use soft delete to reduce reconciliation ambiguity

This policy is intentionally simple for MVP and can evolve later into richer conflict UX.

## Table Scope

### Syncable

- accounts
- categories
- transactions
- settings
- notification preferences

### Direct remote auth/profile

- `public.profiles`

### Local-only

- import records
- export records
- sync operations

## Design Decisions

- the UI does not write directly to Supabase for day-to-day ledger CRUD
- the sync engine is isolated from page components
- derived dashboard and analytics data always read from local source tables
- import/export history stays local-only

## Summary

Finance Ledger now uses Supabase for identity and remote continuity, Dexie for local-first finance data, and a dedicated sync engine to bridge the two. The result is a web application that preserves the product's offline-first behavior instead of turning every finance action into an online-only operation.
