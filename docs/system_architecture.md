# System Architecture

*Finance Ledger - Offline-First Web Architecture*

## Purpose

This document defines the target architecture for Finance Ledger as a web application while preserving the same finance-tracking product scope already established for the project.

## Architectural Reality

Finance Ledger is now documented as an **offline-capable web application** with a local-first data pipeline.

The web stack uses:

- React + TypeScript + Vite for the application shell
- Tailwind CSS and shadcn/ui for the interface layer
- React Router for page routing
- Zustand for application-facing state orchestration
- Dexie + IndexedDB for local business data persistence
- Supabase Auth for identity and session management
- Supabase PostgreSQL for remote profile and ledger storage
- Recharts for dashboard and analytics visualization
- service worker + web manifest for PWA installability and offline shell caching

## Core Runtime Principle

Finance Ledger uses **local write first, cloud sync second** behavior.

Core finance actions should follow this path:

```text
React UI
-> feature action / form validation
-> Dexie local database
-> sync queue / outbox
-> sync engine
-> Supabase / PostgreSQL
```

This means:

- user-facing CRUD does not wait on a network round trip
- dashboard and analytics read from local source data
- offline use remains available for core finance flows
- cloud sync restores continuity when connectivity returns

## High-Level Flows

### Ledger and Sync Flow

```text
React pages and components
-> Zustand stores and feature services
-> Dexie repositories
-> IndexedDB local tables
-> sync outbox and pull checkpoints
-> Supabase Postgres
```

### Auth and Profile Flow

```text
React auth pages
-> Supabase Auth
-> Supabase public.profiles
-> session-aware route guards
```

### Offline Shell Flow

```text
PWA manifest
-> service worker caches app shell and static assets
-> browser loads cached shell offline
-> app reconnects and sync resumes when network returns
```

## Architecture Layers

### Presentation Layer

- React pages, layouts, and dialogs
- shadcn/ui component primitives
- responsive navigation for desktop and mobile browser widths
- no direct Supabase or IndexedDB calls from leaf components

### Application Layer

- React Hook Form + Zod for validated input boundaries
- Zustand stores for session, UI state, filters, and orchestrated workflows
- route guards for signed-out, profile-completion, onboarding, and main-app states
- feature services coordinating reads, writes, and sync-aware side effects

### Data Layer

- Dexie schemas and repositories for local business data
- sync engine for outbox processing, remote pulls, and reconciliation
- Supabase client wrappers for auth, profile, and remote persistence operations

### Storage Layer

- IndexedDB for local source data and sync metadata
- browser cache storage for shell assets
- Supabase PostgreSQL for authenticated remote continuity
- Supabase Auth session storage in the browser

## Main Components

| Component | Responsibility |
| --- | --- |
| React UI | Render pages, forms, tables, charts, and empty states |
| Route Guards | Direct users through signed-out, profile completion, onboarding, and main app states |
| Zustand Stores | Expose app-facing state and coordinate workflows without making UI components own data rules |
| Dexie Database | Persist accounts, categories, transactions, settings, reminders, import/export history, and sync metadata locally |
| Sync Engine | Queue local mutations, push pending changes, pull remote changes, and update sync status |
| Supabase Auth Service | Sign up, sign in, sign out, and restore browser sessions |
| Profile Service | Create, read, and update `public.profiles` |
| PWA Shell | Cache static assets and allow installable browser usage |
| Reminder Service | Persist reminder preferences and trigger browser notification flows or in-app reminder fallbacks |

## Data Ownership Model

### Local Business Data

- accounts
- categories
- transactions
- settings
- notification preferences

These records are readable and writable offline in IndexedDB and are the runtime source of truth for the UI.

### Remote Identity and Profile Data

- `auth.users` managed by Supabase Auth
- `public.profiles` managed by Finance Ledger application logic

### Remote Ledger Continuity Data

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

These tables mirror syncable business records for authenticated cloud continuity and multi-device use.

### Local-Only Operational Data

- import records
- export records
- sync error logs
- outbox entries

### Derived Data

- dashboard totals
- analytics summaries
- account balances
- recent activity

Derived data is computed from transactions and related entities, not stored as canonical source tables.

## Offline-First Behavior

The web app must remain useful when the browser loses connectivity.

Required behavior:

- cached app shell loads after the first successful visit
- local finance data remains available from IndexedDB
- create, edit, and delete operations write locally even when offline
- pending writes are marked for later sync
- sync resumes automatically or on user-triggered retry when connectivity returns

## Conflict and Failure Handling

MVP conflict policy:

- row ownership is scoped by authenticated `user_id`
- soft deletes use `deleted_at` rather than immediate hard deletes
- records carry `updated_at` and sync timestamps
- last-write-wins by trusted timestamp is the default row-level conflict rule for MVP
- rejected writes remain in a failed state locally with retry guidance instead of being discarded silently

## Reminder Architecture Note

The reminder feature remains part of the product, but browser platforms vary in background notification support.

Finance Ledger therefore documents reminders as:

- persisted reminder preferences in Dexie and Supabase
- browser notification permissions where supported
- installable PWA behavior for the best desktop-like experience
- in-app reminder prompts as a fallback when background delivery is limited

## Why This Architecture Fits the Product

- It preserves the original local-first finance workflow.
- It keeps the app usable in weak or absent connectivity.
- It maps cleanly to a web and PWA delivery model.
- It avoids blocking transaction entry on backend availability.
- It keeps backend and sync logic outside page components.
- It creates a practical path to multi-device continuity without changing the finance domain model.

## Phase Scope Clarification

Documented now:

- offline-first web architecture
- installable PWA shell
- Dexie-based local data storage
- Supabase Auth and `public.profiles`
- authenticated sync foundation for business tables
- responsive browser-based pages and views

Planned later:

- richer sync conflict UX
- deeper chatbot/backend workflows
- advanced server-side automation
- broader notification delivery beyond browser constraints

## Summary

Finance Ledger is now documented as a React-based, offline-capable web application. The architecture centers the browser as the primary client, IndexedDB as the immediate source of truth, and Supabase as the authenticated cloud backend that receives synchronized changes after local writes succeed.
