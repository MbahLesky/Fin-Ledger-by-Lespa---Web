# Module Documentation

*Finance Ledger Web*

## Introduction

This document defines the application modules for the web version of Finance Ledger. The business capabilities stay the same as the earlier product planning, but the implementation is now aligned to a browser-first, offline-first architecture.

## Core Principles

- feature-first organization
- React pages and components stay presentation-focused
- Dexie-backed local ledger persistence
- sync happens behind the scenes through a dedicated engine
- Supabase owns authentication and remote profile continuity
- local-first behavior remains the default for business data
- responsive browser and PWA usage guide interface decisions

## Module Overview

| Module | Purpose |
| --- | --- |
| Authentication | Email auth, session restore, profile completion, guarded future auth entry points, and sign-out |
| Backend Integration | Supabase client setup, auth, profile access, and remote sync APIs |
| Sync | Outbox processing, pull reconciliation, sync status tracking, and retry handling |
| Onboarding | Currency choice, optional import, opening balances, and reminder setup |
| Accounts | Default/custom account management and account-derived balance context |
| Categories | System/custom category management and type-aware category usage |
| Transactions | Create, edit, delete, filter, and persist ledger records |
| Transfers | Move funds across owned accounts without misclassifying transfer amount as income/expense |
| Dashboard | Derived balance and activity summaries |
| Analytics | Derived charts and trends from stored transactions |
| Import/Export | CSV parsing, validation, mapping, commit/export flows, and local history |
| Settings | Preference management, reminders, reset flow, and sign-out entry point |
| Local Persistence | Dexie schema, repositories, migrations, seeding, and ownership-aware local storage |
| PWA / Browser Services | installability, caching, browser notifications, connectivity, and file download/upload interaction |

## Module Details

### Authentication Module

Responsibilities:

- sign up with email/password
- sign in with email/password
- restore Supabase browser sessions on reload
- keep Google and phone auth visible in the UI as guarded later-phase entry points
- route users through signed-out, profile-completion, onboarding, and signed-in states
- expose user-facing validation and auth error mapping

### Backend Integration Module

Responsibilities:

- initialize the Supabase browser client early in app startup
- load environment-based configuration
- create, read, and update the app-level `public.profiles` row
- keep client access limited to publishable-key behavior

### Sync Module

Responsibilities:

- write syncable mutations to a local outbox after local commits succeed
- push pending writes to Supabase when a session and network are available
- pull remote changes by checkpoint or updated timestamp
- reconcile local records with remote state
- mark records as `pending`, `synced`, or `failed`
- keep local-first behavior even when sync is unavailable

### Onboarding Module

Responsibilities:

- select preferred currency
- offer `Start fresh` or `Import existing records`
- manage opening balances
- manage reminder setup
- persist onboarding completion
- continue only after the user has a valid authenticated session

### Accounts Module

Responsibilities:

- preserve default Cash and Bank accounts
- manage custom accounts such as MoMo, Wallet, Savings, or other balance containers
- support imported account creation or mapping
- feed balance summaries into dashboard and analytics
- keep account balances derived from opening balance plus transactions

### Categories Module

Responsibilities:

- preserve system categories
- create custom categories
- support imported category creation or mapping
- keep transaction and category type alignment safe

### Transactions Module

Responsibilities:

- create, update, and soft-delete transactions
- expose searchable and filterable history
- preserve source metadata such as CSV import references
- remain the ledger source of truth for totals, reports, and charts

### Transfers Module

Responsibilities:

- create and soft-delete account-to-account transfers
- validate source and destination account constraints
- enforce source balance checks for `amount + fee`
- keep transfer amount separate from income and expense transactions
- expose transfer rows in history with dedicated UI semantics
- feed account balance derivation and fee-aware expense analytics

### Dashboard Module

Responsibilities:

- derive balance, totals, and recent activity from persisted local records
- show account summaries and quick actions
- expose empty states that work with true first-run data

### Analytics Module

Responsibilities:

- derive totals and chart series from stored transactions
- handle empty datasets safely
- support responsive chart rendering across desktop and mobile browser widths

### Import/Export Module

Responsibilities:

- read local CSV files from the browser file picker
- parse rows and validate headers/content
- detect duplicates conservatively
- build account and category mapping state
- commit valid rows through local repositories
- generate downloadable CSV exports from stored transactions
- record local import/export history

### Settings Module

Responsibilities:

- persist currency, theme, and reminder preferences
- expose import/export entry points
- expose reset-app-data flow
- trigger clean sign-out behavior
- surface sync status and reconnect guidance where helpful

### Local Persistence Module

Responsibilities:

- define Dexie schema and repositories
- initialize settings, default accounts, and system categories once
- keep local-only history and sync tables separate from business tables
- stamp local rows with sync metadata
- support deterministic schema upgrades for IndexedDB

### PWA / Browser Services Module

Responsibilities:

- register and update the service worker
- cache static assets for offline shell loading
- support install prompts where browsers allow them
- coordinate browser notification permission checks
- handle browser file import and download flows safely

## Integration Notes

- Authentication depends on Backend Integration and route guards.
- Sync depends on Local Persistence, Backend Integration, and Authentication.
- Import/Export depends on Accounts, Categories, Transactions, and Local Persistence.
- Dashboard and Analytics depend on derived queries, not stored summary tables.
- Transfers depends on Accounts for validation and balance updates, and feeds Dashboard/Analytics derivations.
- Onboarding and Settings share the same settings, accounts, and reminder persistence.
- Profile metadata can reflect onboarding and preferred currency without moving ledger source data out of the local-first model.
- Import/export history remains operational and local-only.

## Future Expansion Notes

- chatbot workflows can reuse the same domain entities and ownership rules
- richer conflict handling can layer on top of the documented sync engine
- server-assisted notifications can be added later without changing reminder preferences as a feature
- additional client surfaces can consume the same Supabase-backed remote model

## Summary

The module boundaries still reflect the same Finance Ledger product: auth, onboarding, accounts, categories, transactions, transfers, analytics, reminders, and CSV portability. What changes is the delivery model: React pages, Dexie local storage, a dedicated sync engine, and Supabase-backed authentication and continuity.
