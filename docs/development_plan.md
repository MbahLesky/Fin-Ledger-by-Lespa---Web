# Development Plan

*Finance Ledger - Web Application Delivery Plan*

## Current Phase

The active web phase removes the broken sync layer and uses Supabase directly for shared business data.

The implementation goal is:

- shared records load from Supabase
- shared records write to Supabase
- realtime subscriptions refresh the UI
- local storage is limited to local-only operational data
- web and mobile see the same records for the same authenticated user

## Completed/Active Architecture Decisions

- React + TypeScript + Vite remains the frontend stack.
- Supabase Auth remains the identity provider.
- Supabase PostgreSQL is the source of truth for shared ledger data.
- Supabase Realtime is used for backend change notifications.
- repository modules remain the app-facing data boundary.
- the Dexie/outbox/local-first shared-data path is removed.

## Delivery Phases

### Phase 1: Web Shell and Routing

Status: complete enough for current work

Scope:

- Vite/React app shell
- route constants and route guards
- auth, onboarding, dashboard, transactions, transfers, analytics, settings, import, and export routes

### Phase 2: Auth and Profile Foundation

Status: active

Scope:

- email/password auth
- session restore
- profile ensure/update flow
- route decisions for profile completion and onboarding

### Phase 3: Direct Supabase Data Layer

Status: active/current

Scope:

- remove sync engine and outbox code
- remove Dexie as business-data storage
- refactor repositories to Supabase CRUD
- seed default settings, accounts, and categories in Supabase
- enforce auth-aware reads and writes
- clear app-facing state on sign-out/user change

Success indicators:

- account creation writes to Supabase
- transaction creation writes to Supabase
- dashboard/history/analytics read backend data
- no sync code or dependency remains in the web app

### Phase 4: Supabase Realtime Refresh

Status: active/current

Scope:

- one realtime channel per signed-in user
- subscriptions for accounts, categories, transactions, transfers, settings, notification preferences, and profile
- query invalidation after backend changes
- cleanup on logout or auth change
- visible reconnect/offline state

Success indicators:

- mobile-created backend records appear on web after realtime/refetch
- web-created records update open pages without a full reload
- no duplicate subscriptions remain after auth changes

### Phase 5: Local-Only Browser Data Boundary

Status: active/current

Scope:

- import/export history stored locally
- import preview and mapping state remain transient
- browser notification permission remains device-specific
- no shared ledger record is stored as local-only source data

### Phase 6: UX Hardening

Status: next

Scope:

- strengthen loading states
- strengthen write failure feedback
- improve realtime reconnect messaging
- broaden validation and test coverage for backend write failures

### Phase 7: Testing and Deployment

Status: next

Scope:

- TypeScript build
- lint
- unit tests for calculations/import/validation
- manual auth scenarios
- cross-device Supabase validation with mobile

## Explicitly Out of Scope

- PowerSync rework
- offline mutation queues
- write-locally-then-upload behavior
- chatbot flows
- large unrelated redesign

## Validation Checklist

- sign in and load shared data from Supabase
- create account on web and verify it exists in Supabase
- create transaction on web and verify dashboard/history update
- sign in on mobile and verify web-created records appear
- change data on mobile and verify web refreshes
- sign out and sign in as another user without showing prior data
- verify import/export history remains local-only
- verify removed sync code has no imports or dead references

## Summary

The current delivery plan prioritizes reliable shared backend data over offline-first behavior. Offline shared-data sync can be reconsidered later as a new design, but the current web app must stay direct-Supabase and online-first.
