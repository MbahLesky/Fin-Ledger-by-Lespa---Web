# System Architecture

*Finance Ledger - Web Direct Supabase Architecture*

## Purpose

This document defines the current web architecture after removing the broken local sync layer.

## Current Direction

Finance Ledger Web is now an online-first React application for shared business data.

The active stack is:

- React + TypeScript + Vite for the web shell
- React Router for guarded app navigation
- Tailwind CSS and shadcn/ui primitives for the interface
- Zustand for auth, UI, filters, and realtime connection state
- Supabase Auth for identity and browser session restore
- Supabase PostgreSQL as the source of truth for shared ledger records
- Supabase Realtime for backend change notifications
- browser local storage only for selected local-only operational history
- service worker and manifest for installable shell behavior, not offline shared-data writes

The previous Dexie/IndexedDB outbox sync layer is removed from the web app. Shared business records are not written locally first and are not queued for later upload in this phase.

## Runtime Principle

Shared business data follows this path:

```text
React UI
-> form validation / feature action
-> repository or service module
-> Supabase client
-> Supabase PostgreSQL with RLS
-> Supabase Realtime event
-> query invalidation and UI refresh
```

This means:

- reads come from Supabase
- writes go directly to Supabase
- RLS and `auth.uid()` protect ownership
- realtime events refresh visible data after backend changes
- offline shared-data writes fail clearly instead of pretending to save
- web and mobile users signed into the same account see the same backend data

## Architecture Layers

### Presentation Layer

- pages, layouts, dialogs, forms, charts, and shared UI components
- no raw Supabase table calls in presentation components
- loading, empty, and failure states are shown at page or feature boundaries

### Application Layer

- route guards for signed-out, profile-completion, onboarding, and protected app areas
- React Hook Form and Zod for validated input
- focused hooks such as `useBackendQuery`
- Zustand stores for auth, UI state, filters, and realtime status

### Data Layer

- repository modules under `src/db/repositories/` remain the app-facing data boundary
- repositories now use direct Supabase CRUD
- `profile-service` manages `public.profiles`
- `ledger-realtime-service` owns the single shared Supabase Realtime subscription per signed-in user
- `audit-repository` stores local-only import/export history in browser storage

### Backend Layer

- Supabase Auth owns identity
- Supabase PostgreSQL owns shared ledger data
- RLS policies restrict rows to the authenticated owner
- Supabase Realtime broadcasts changes for shared tables

## Shared Source-of-Truth Tables

These tables are shared, backend-backed, and user-owned:

- `public.profiles`
- `public.accounts`
- `public.categories`
- `public.transactions`
- `public.transfers`
- `public.settings`
- `public.notification_preferences`

The web client filters and writes by the active authenticated user. The backend also enforces ownership through RLS.

## Local-Only Data

Only device/browser-specific operational data remains local:

- CSV import history
- CSV export history
- temporary import preview and mapping state in component memory
- browser notification permission state
- transient UI state such as filters or open dialogs

Accounts, categories, transactions, transfers, settings, and shared notification preferences must not be stored as local-only business records.

## Realtime Flow

On sign-in, the app opens one realtime channel scoped to the user. It subscribes to:

- `accounts`
- `categories`
- `transactions`
- `transfers`
- `settings`
- `notification_preferences`
- `profiles`

On a backend change, the realtime store increments a revision counter. Backend query hooks observe that revision and refetch their repository query. On logout or user change, the subscription is removed and in-memory query state is cleared by auth-aware hooks.

## Auth and Cleanup

- app bootstrap restores the Supabase session
- profile rows are ensured after authentication
- default settings, accounts, and categories are seeded in Supabase for the signed-in user when missing
- sign-out clears auth state and realtime state
- hooks stop returning prior user data when auth state changes

## Online-First Behavior

The app shell may still load from browser cache, but shared-data actions require network access.

Expected behavior:

- reads require a valid session and backend availability
- writes check browser connectivity and surface Supabase errors
- no offline shared-data queue exists in this phase
- local-only import/export history can remain available on the device

## Out of Scope

- PowerSync
- Dexie business-data persistence
- offline mutation queues
- conflict resolution UX
- chatbot or server automation

## Summary

Finance Ledger Web now uses Supabase directly as the shared data source of truth. The old sync layer has been removed, realtime subscriptions keep the UI refreshed, and local persistence is limited to browser/device-only operational data.
