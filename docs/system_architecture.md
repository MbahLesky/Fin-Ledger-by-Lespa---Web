# System Architecture

*Finance Ledger - Local-First Ledger with PowerSync and Supabase*

## Purpose

This document describes the architecture currently implemented in the mobile app after PowerSync was introduced on March 27, 2026.

## Current Architectural Reality

Finance Ledger is a **local-first Flutter application** with a sync-aware data layer.

The app now uses:

- Flutter for UI
- Riverpod for application state and orchestration
- Drift for local business data persistence
- SQLite on-device storage
- PowerSync as the sync layer over the same SQLite database
- Supabase Auth for identity and session management
- Supabase `public.profiles` for app-level user profiles
- device services for notifications

Ledger data remains readable and writable locally first. When `POWERSYNC_URL` is configured and the user is authenticated, PowerSync can synchronize selected business tables with Supabase/Postgres.

## Current Runtime Flow

Ledger and sync flow:

```text
Flutter UI
-> Riverpod application state
-> Drift DAOs
-> SQLite local database
-> PowerSync sync layer
-> Supabase / Postgres
```

Auth and profile flow:

```text
Flutter UI
-> Riverpod auth/session providers
-> Supabase Auth
-> Supabase public.profiles
```

Reminder scheduling flow:

```text
Riverpod settings flow
-> Drift notification preference persistence
-> LocalNotificationService
-> device notification scheduler
```

## Architectural Direction

The app now actively uses the PowerSync-ready version of the local architecture instead of only planning for it.

Important boundary:

- `public.profiles` remains a direct Supabase auth/profile concern in this phase
- syncable ledger and preference tables are managed through Drift plus PowerSync

## Architecture Layers

### Presentation Layer

- Flutter screens and widgets
- auth, onboarding, dashboard, transactions, analytics, and settings flows
- no direct database or Supabase calls from widgets

### Application Layer

- Riverpod providers
- Riverpod notifiers/controllers
- session-aware routing
- onboarding, import/export, and settings orchestration

### Data Access Layer

- Drift database and DAOs for local ledger data
- PowerSync database connection and auth-aware sync lifecycle
- Supabase auth/profile services for identity and app-level user records
- bootstrap and workspace ownership coordination

### Storage Layer

- SQLite on-device storage for ledger and app state
- PowerSync metadata and upload queue in the same SQLite database
- Supabase Auth session storage
- Supabase `public.profiles` for remote user profile data

## Main Components

| Component | Current Responsibility |
| --- | --- |
| Flutter UI | Render screens and capture user actions |
| Riverpod State Layer | Expose app-facing state and coordinate writes |
| GoRouter + session providers | Route between signed-out, profile-completion, onboarding, and main-app states |
| Drift Database | Persist local accounts, categories, transactions, settings, and local history |
| PowerSync Layer | Track local mutations, download remote changes, and keep synced tables ready for multi-device use |
| Supabase Auth Service | Sign up, sign in, sign out, restore session, and preserve future OAuth / OTP integration points |
| Profile Service | Create, read, and update the app-level `profiles` row |
| Local Notification Service | Schedule and cancel device reminders |
| Bootstrap Layer | Initialize first-run defaults, reset local data safely, and claim local ownership for the authenticated user |

## Data Ownership Model

### Local Business Data

- accounts
- categories
- transactions
- settings
- notification preferences

These records stay local-first in runtime behavior, but they are now also PowerSync-managed for synchronization when configured.

### Remote Identity and Profile Data

- `auth.users` managed by Supabase Auth
- `public.profiles` managed by Finance Ledger application logic

`auth.users` is the identity source.
`public.profiles` is the app-level user record.

### Local-Only Operational Data

- import history
- export history

### Derived Data

- dashboard summary
- analytics summary
- current balances
- filter results

## Why This Architecture Fits the Product

- It keeps the ledger usable offline today.
- It adds real authentication without forcing sync too early.
- It keeps widgets thin and provider-driven.
- It preserves Drift as the local source of truth for business data.
- It creates a clean path to ownership-aware sync later.
- It supports safe CSV portability without backend coupling.

## Current Auth and Workspace Boundary

Authentication is now real, but sync is still not implemented.

Because of that:

- the first authenticated user on a device can claim the existing local workspace
- newly created local business records are stamped with that authenticated user id
- if a different user signs in on the same device before sync exists, the local workspace is reset to prevent cross-account leakage

This is a deliberate safety rule for the current phase.

## Integration Boundaries

### Active PowerSync Boundary

- observe syncable raw tables on the local SQLite database
- keep Drift as the read/write API used by the rest of the app
- connect only when the user is authenticated and PowerSync is configured
- disconnect safely on sign out

### Active Supabase Backend Boundary

- Supabase Auth owns identity
- `public.profiles` owns app-level profile data
- remote ledger tables own synced business records with `user_id` ownership
- RLS protects remote business rows per authenticated user

## Phase Scope Clarification

Implemented now:

- local persistence with Drift
- schema versioning and migrations
- Supabase initialization through environment-based configuration
- email/password auth
- Google and phone auth entry points shown as upcoming features
- session restore on launch
- app-level profile storage in `public.profiles`
- session-aware routing
- local workspace ownership stamping
- PowerSync client integration on the same SQLite database
- auth-aware PowerSync connection management
- sync-ready remote ledger table migrations for Supabase/Postgres
- clear syncable versus local-only table boundaries

Not implemented now:

- phone OTP auth
- Google OAuth auth
- forgot password flow
- full conflict-resolution UX
- complete operational PowerSync Cloud setup from inside the Flutter app
- chatbot/backend workflows
- service-role usage in the Flutter client

## Summary

Finance Ledger now runs as a local-first mobile architecture with real Supabase auth, real remote profile ownership, and an active PowerSync sync foundation. Drift remains the app-facing data layer, while PowerSync and Supabase now provide the path to authenticated multi-device continuity.
