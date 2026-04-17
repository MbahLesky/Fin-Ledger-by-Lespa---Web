# Sync Layer Removal Plan

## Goal

Remove the broken web sync layer and replace it with direct Supabase CRUD plus realtime refresh.

## Removed From Web

- sync engine
- sync repository/outbox
- sync status store
- sync status UI
- Dexie business-data database
- sync metadata from TypeScript shared entities
- Dexie React live query usage

## Replacement

- Supabase-backed repositories for shared data
- `ledger-realtime-service` for subscriptions
- `realtime-store` for connection status and query invalidation
- `useBackendQuery` for auth-aware backend reads
- local storage only for import/export audit history

## Validation

- `rg` must not find active source imports for Dexie or sync modules
- `npm run build` must pass
- user-level CRUD must save directly to Supabase
- sign-out must clear in-memory shared state
- realtime changes must trigger refetches

## Phase Boundary

This is not an offline sync redesign. Shared business data is online-first until a future architecture is explicitly approved.
