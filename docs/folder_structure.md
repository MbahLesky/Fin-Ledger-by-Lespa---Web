# Folder Structure

*Project: Monilog Web*

## Overview

This document describes the recommended project structure for the Monilog web application using React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase, Dexie, and PWA support.

The structure remains feature-first while centralizing cross-feature foundations such as routing, local persistence, sync, auth, and shared UI.

## Recommended Root Structure

```text
fin-ledger-web/
|-- docs/
|-- public/
|   |-- icons/
|   |-- manifest.webmanifest
|   |-- offline.html
|   `-- robots.txt
|-- src/
|-- supabase/
|   `-- migrations/
|-- tests/
|-- index.html
|-- package.json
|-- tailwind.config.ts
|-- tsconfig.json
|-- vite.config.ts
`-- vercel.json
```

## `src/` Structure

```text
src/
|-- app/
|-- assets/
|-- components/
|-- db/
|-- features/
|-- hooks/
|-- lib/
|-- pages/
|-- providers/
|-- routes/
|-- services/
|-- store/
|-- types/
|-- utils/
`-- main.tsx
```

## Folder Responsibilities

### `src/app/`

App-level composition and startup wiring.

Representative files:

- `App.tsx`
- `app-shell.tsx`
- `bootstrap.ts`
- `theme.ts`

Responsibilities:

- initialize top-level providers
- boot the router
- hydrate the auth session
- register PWA listeners where needed

### `src/components/`

Reusable presentational building blocks shared across features.

Suggested structure:

```text
components/
|-- charts/
|-- data-display/
|-- forms/
|-- layout/
|-- navigation/
|-- tables/
`-- ui/
```

Responsibilities:

- shadcn/ui wrappers and composed primitives
- reusable layout sections
- empty states, cards, dialogs, and navigation components
- chart containers and data presentation helpers

### `src/features/`

Feature-first business modules.

Representative structure:

```text
features/
|-- accounts/
|-- analytics/
|-- auth/
|-- categories/
|-- dashboard/
|-- import-export/
|-- onboarding/
|-- reminders/
|-- settings/
`-- transactions/
```

Each feature may include:

- components
- forms
- services
- schemas
- hooks
- selectors
- route-specific loaders or actions where applicable

### `src/pages/`

Page-level entry components that map to browser routes.

Representative pages:

- `login-page.tsx`
- `register-page.tsx`
- `profile-completion-page.tsx`
- `onboarding-page.tsx`
- `dashboard-page.tsx`
- `transactions-page.tsx`
- `analytics-page.tsx`
- `settings-page.tsx`
- `import-page.tsx`
- `export-page.tsx`

### `src/routes/`

Central route definitions and guards.

Representative files:

- `index.tsx`
- `protected-route.tsx`
- `auth-route.tsx`
- `route-constants.ts`

Responsibilities:

- define the React Router tree
- handle signed-out and protected flows
- enforce profile-completion and onboarding gates

### `src/store/`

Zustand stores and selectors.

Representative stores:

- `auth-store.ts`
- `ui-store.ts`
- `sync-store.ts`
- `transaction-filters-store.ts`

Responsibilities:

- hold app-facing view state
- expose actions that orchestrate repository and service calls
- avoid mixing long-lived UI state with raw persistence concerns

### `src/db/`

Dexie database, table schemas, repositories, migrations, and sync metadata.

Suggested structure:

```text
db/
|-- dexie.ts
|-- migrations/
|-- repositories/
|-- schema/
|-- seed/
`-- sync/
```

Responsibilities:

- define IndexedDB tables
- version schema changes safely
- encapsulate local CRUD boundaries
- manage outbox, checkpoints, and sync status fields

### `src/services/`

Cross-feature integration services.

Representative services:

- `supabase-auth-service.ts`
- `profile-service.ts`
- `sync-engine.ts`
- `csv-import-service.ts`
- `csv-export-service.ts`
- `notification-service.ts`

Responsibilities:

- connect external SDKs to internal repositories and stores
- keep third-party details out of pages and components

### `src/lib/`

Shared framework and SDK setup.

Representative files:

- `supabase-client.ts`
- `env.ts`
- `query-helpers.ts`
- `date-utils.ts`

Responsibilities:

- environment parsing
- client singletons
- low-level library helpers

### `src/hooks/`

Reusable React hooks shared across features.

Examples:

- `use-network-status.ts`
- `use-install-prompt.ts`
- `use-reminder-permission.ts`
- `use-sync-status.ts`

### `src/providers/`

App-wide provider composition.

Examples:

- `router-provider.tsx`
- `theme-provider.tsx`
- `session-provider.tsx`

### `src/types/`

Shared TypeScript domain and DTO types.

Examples:

- `account.ts`
- `transaction.ts`
- `profile.ts`
- `sync.ts`

### `src/utils/`

Pure helpers and formatting logic.

Examples:

- currency formatting
- CSV normalization
- duplicate detection helpers
- validation adapters

### `src/assets/`

Static assets imported by the app bundle.

Examples:

- brand graphics
- onboarding illustrations
- local SVG assets

### `public/`

Files served directly by Vite and cached by the PWA layer where appropriate.

Key files:

- `manifest.webmanifest`
- install icons
- offline fallback assets

## Architecture Placement Rules

- page components stay in `src/pages/`
- reusable visual primitives stay in `src/components/`
- route definitions stay in `src/routes/`
- local database code stays in `src/db/`
- SDK setup stays in `src/lib/`
- cross-feature integrations stay in `src/services/`
- long-lived app state stays in `src/store/`
- feature-specific logic stays inside `src/features/`
- SQL migrations for Supabase stay in `supabase/migrations/`

## Why Database Code Lives in `src/db/`

The local IndexedDB layer is a shared application foundation rather than a single feature.

It supports:

- onboarding
- accounts
- categories
- transactions
- settings and reminders
- import/export audit history
- sync coordination

## Future Growth Direction

If the repository later expands into multiple deployable surfaces, this web client can remain in a `web/` workspace while Supabase SQL, edge functions, or chatbot integrations move into separate packages without changing the internal boundaries described here.

## Summary

The recommended structure keeps the project feature-first and implementation-practical for a React + Vite application while giving offline persistence, sync, auth, and PWA responsibilities clear homes.
