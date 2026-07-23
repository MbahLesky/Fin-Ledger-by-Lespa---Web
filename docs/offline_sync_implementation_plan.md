# Offline Sync Implementation Plan

*Monilog - Dexie to Supabase Sync Foundation*

## Purpose

This document defines how Monilog introduces remote continuity in the web application without giving up local-first behavior.

## Why a Sync Foundation Is Needed

- the app already relies on IndexedDB for strong offline behavior
- authenticated users still need durable remote continuity
- the product may later support multi-device usage and chatbot-assisted updates

## Core Architecture

```text
React UI
-> validated feature actions
-> Dexie repositories
-> IndexedDB
-> sync outbox
-> Supabase Postgres
```

## Syncable Business Scope

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

Excluded from sync:

- `import_records`
- `export_records`
- `sync_operations`

## Implementation Plan

### Step 1: Add Sync Metadata to Local Records

Each syncable local record should carry:

- `user_id`
- `remote_id`
- `sync_status`
- `sync_error`
- `last_synced_at`
- `updated_at`
- `deleted_at`

### Step 2: Create an Outbox Table

The local database should track:

- entity name
- entity id
- operation type
- payload snapshot or reference
- retry count
- attempt timestamps
- failure messages

### Step 3: Push Pending Changes

- only push when a valid Supabase session exists
- process pending rows in a deterministic order
- upsert creates and updates
- soft-delete rows with `deleted_at` instead of hard-removing them first

### Step 4: Pull Remote Changes

- fetch remote rows changed since the last checkpoint
- merge them into Dexie
- update `last_synced_at` and clear successful failure states

### Step 5: Retry and Visibility

- retry automatically on reconnect
- expose sync state in the UI when records are pending or failed
- keep failures non-destructive to local data

## When Connectivity Is Missing

- the app keeps using Dexie and IndexedDB normally
- all core ledger flows remain available
- pending writes accumulate in the outbox
- the app shell remains available through the cached PWA shell once previously loaded

## Required Supabase Setup

- Auth enabled for Monilog users
- `public.profiles` table with RLS
- remote ledger tables with `user_id` ownership
- RLS policies enforcing `user_id = auth.uid()`
- indexes supporting `user_id`, `updated_at`, and soft-delete queries

## Risks and Watchpoints

- IndexedDB migrations must not corrupt local data
- retries must avoid duplicate remote rows
- default seeded IDs must remain safe under per-user ownership
- conflict handling needs a simple, documented rule before multi-device usage expands

## Summary

The sync plan keeps Monilog faithful to its local-first behavior. Users save data into IndexedDB immediately, then the app syncs that state to Supabase when the browser session and network allow it.
