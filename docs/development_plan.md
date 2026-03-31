# Development Plan

*Finance Ledger*

## Introduction

Finance Ledger is being delivered in layers so the product stays useful while the architecture becomes more durable and ownership-aware.

## Current Delivery Stages

1. UI-first screens
2. Riverpod-driven local interactivity
3. Drift-backed local persistence
4. CSV import/export portability
5. Supabase authentication and profile foundation
6. PowerSync sync foundation

The codebase is currently operating in **Stage 6: local-first ledger plus auth-aware sync foundation**.

## Guiding Principles

- keep the app usable at every stage
- replace temporary behavior with durable local behavior
- add identity before sync
- do not add sync complexity before ownership boundaries are stable
- keep future backend adoption incremental

## Delivery Phases

### Phase 1: UI Foundation

Status: completed

Delivered:

- core navigation and screen structure
- onboarding, dashboard, transactions, analytics, and settings surfaces

### Phase 2: Local Interaction

Status: completed

Delivered:

- add/edit/delete transaction flows
- local filters and search
- Riverpod-driven state coordination

### Phase 3: Drift Local Persistence

Status: completed

Delivered:

- Drift schema and DAOs
- persisted settings, accounts, categories, transactions, and history tables
- first-run initialization and reset behavior
- removal of seeded/mock transactional data

### Phase 4: CSV Import / Export

Status: completed

Delivered:

- local CSV import flow with preview, validation, mapping, duplicate checks, and summary
- onboarding import entry point
- settings import/export management screens
- CSV export for all transactions through the device share/save flow
- local import/export audit history

### Phase 5: Supabase Auth Foundation

Status: completed in the current milestone

Delivered:

- Supabase initialization through environment-based configuration
- email/password authentication
- Google and phone auth entry points retained in the UI as upcoming features
- session-aware routing and restore on launch
- remote app-level profile storage in `public.profiles`
- local workspace ownership stamping through authenticated `user_id`

### Phase 6: Hardening and Coverage

Status: completed as part of the current milestone

Focus:

- more targeted tests around auth plus local data interactions
- better setup guidance for Supabase project configuration
- UX polish around auth edge cases and first-run profile completion

### Phase 7: PowerSync Foundation

Status: completed in the current milestone

Delivered:

- PowerSync package integration in Flutter
- Drift + PowerSync raw-table alignment on the same SQLite database
- auth-aware PowerSync connection lifecycle
- remote Supabase ledger table migrations and RLS
- documented syncable versus local-only scope
- local-first fallback when PowerSync is not configured

### Phase 8: Sync Validation and Conflict Hardening

Status: future

Target deliverables:

- broader multi-device validation
- conflict-handling rules and UX polish
- multi-device continuity
- chatbot/backend integrations
- server-side workflows where appropriate

## Recommended Implementation Order From Here

1. Finish PowerSync Cloud/project setup outside the app
2. Validate sync flows on real devices and network transitions
3. Harden conflict expectations around edits and deletes
4. Extend backend workflows only after sync behavior is stable

## Success Indicators

| Phase | Success Indicator |
| --- | --- |
| Local Interaction | Core actions feel responsive and predictable |
| Drift Persistence | Data survives restarts and remains locally durable |
| CSV Portability | Users can safely move records in and out without mock/demo paths |
| Auth Foundation | Real users can sign in, restore sessions, and get a profile row reliably |
| PowerSync Foundation | Sync can be introduced without replacing Drift or rewriting widgets |
| Future Sync Hardening | Multi-device continuity behaves predictably under real-world conditions |

## Summary

The project has now crossed from local-only authenticated behavior into a real sync-aware architecture. The next major step is validating and hardening PowerSync behavior in real-world conditions before layering on richer backend workflows or conflict UX.
