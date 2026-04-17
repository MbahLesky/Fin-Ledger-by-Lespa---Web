# Folder Structure

*Finance Ledger Web*

## Purpose

This document describes the current React + Supabase web structure.

## Root

```text
src/
  app/
  assets/
  components/
  db/
  features/
  hooks/
  lib/
  pages/
  providers/
  routes/
  services/
  store/
  types/
  utils/
supabase/
  migrations/
docs/
```

## Key Folders

### `src/app`

Application root and global styles.

### `src/components`

Reusable UI primitives, layout pieces, and display components.

### `src/db/repositories`

App-facing data repositories. Despite the folder name, these repositories now call Supabase directly for shared data. `audit-repository.ts` is the exception and stores local-only import/export history.

### `src/features`

Feature-owned forms, schemas, and workspaces.

### `src/hooks`

Reusable React hooks, including backend query and browser capability hooks.

### `src/lib`

Supabase client setup, constants, environment helpers, and generic utilities.

### `src/pages`

Route-level page components.

### `src/providers`

App bootstrap, provider composition, and theme handling.

### `src/routes`

Route tree and route guards.

### `src/services`

Supabase auth/profile helpers, realtime service, CSV import/export, analytics, and browser services.

### `src/store`

Focused Zustand stores for auth, UI, filters, and realtime connection/invalidation state.

### `src/types`

Domain and UI-facing TypeScript types. Shared business entities do not include removed sync metadata.

### `supabase/migrations`

Database schema and RLS migrations for Supabase.

## Removed Structure

The web app no longer contains active folders or files for:

- local business-data database schemas
- mutation outbox
- sync status store
- sync engine
- sync-specific types

## Summary

The structure remains feature-first while centralizing Supabase CRUD, auth, realtime, and local-only browser concerns in clear service/repository boundaries.
