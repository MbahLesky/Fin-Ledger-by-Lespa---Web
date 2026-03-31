# Module Documentation

*Finance Ledger*

## Introduction

This document defines the current module responsibilities after the Drift migration, CSV import/export implementation, Supabase auth foundation work, and PowerSync integration.

## Core Principles

- feature-first organization
- Riverpod-facing application logic
- Drift-backed local ledger persistence
- PowerSync-backed sync readiness over the same SQLite database
- Supabase-backed authentication and profile ownership
- local-first behavior for business data
- widgets stay thin where practical

## Module Overview

| Module | Purpose |
| --- | --- |
| Authentication | Email auth, session restore, profile completion, guarded future-auth entry points, and sign-out |
| Backend Integration | Supabase initialization, client access, and profile table access |
| Sync | PowerSync schema, auth-aware connection lifecycle, and upload/download coordination |
| Onboarding | Currency choice, optional import, opening balances, and reminders |
| Accounts | Default/custom account management and account-derived balance context |
| Categories | System/custom category management and type-aware category usage |
| Transactions | Create, edit, delete, filter, and persist ledger records |
| Dashboard | Derive glanceable balance and activity summaries |
| Analytics | Derive charts and breakdowns from persisted transactions |
| Import/Export | CSV parsing, validation, mapping, commit/export flows, and local history |
| Settings | Preference management, reminders, reset flow, and sign-out entry point |
| Local Persistence | Drift schema, DAOs, bootstrap, migrations, and workspace ownership handling |
| Device Services | Local notifications and platform share/file interactions |

## Module Details

### Authentication Module

Responsibilities:

- sign up with email/password
- sign in with email/password
- keep phone OTP entry points visible as upcoming features
- keep Google entry points visible as upcoming features
- restore Supabase sessions on launch
- route users through signed-out, profile-completion, onboarding, and signed-in states
- expose user-facing auth validation and error mapping

### Backend Integration Module

Responsibilities:

- initialize Supabase early in app startup
- load environment-based configuration
- expose the Supabase client through Riverpod providers
- create, read, and update the app-level `public.profiles` row
- keep client access limited to publishable-key behavior

### Sync Module

Responsibilities:

- open the PowerSync database on the same SQLite file used by Drift
- register Drift-managed syncable tables as PowerSync raw tables
- recreate PowerSync CRUD triggers after schema open
- connect PowerSync only when the authenticated Supabase session is available
- upload local changes through a dedicated sync connector instead of widget-level backend writes
- keep local-first behavior when PowerSync is not configured

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
- manage custom accounts
- support imported account creation or mapping
- stamp newly created local records with the authenticated `user_id` when available
- feed account summaries into dashboard and analytics

### Categories Module

Responsibilities:

- preserve system categories
- create custom categories
- support imported category creation or mapping
- keep transaction/category type alignment safe
- stamp newly created local records with the authenticated `user_id` when available

### Transactions Module

Responsibilities:

- create, update, and soft-delete transactions
- expose searchable/filterable history
- preserve source metadata such as CSV import reference text
- remain the ledger source of truth
- attach authenticated `user_id` values to new records when available

### Dashboard Module

Responsibilities:

- derive totals and balances from persisted source records
- show account breakdowns and recent activity
- expose empty states that work with real first-run data

### Analytics Module

Responsibilities:

- derive totals and breakdowns from stored transactions
- handle empty datasets safely

### Import/Export Module

Responsibilities:

- pick local CSV files for import
- parse CSV rows and validate headers/content
- detect duplicate rows conservatively
- build account/category mapping state
- commit valid rows through Drift
- generate CSV exports from stored transactions
- record local import/export history
- apply the authenticated `user_id` to imported business records when available

### Settings Module

Responsibilities:

- persist currency, theme, and reminder preferences
- expose import/export entry points
- expose reset-app-data flow
- trigger clean sign-out behavior

### Local Persistence Module

Responsibilities:

- define Drift schema and DAOs
- initialize settings, default accounts, and system categories once
- keep local-only history tables separate from business tables
- claim or reset the local workspace based on the authenticated user until sync exists
- preserve compatible local table shapes for PowerSync raw-table sync

### Device Services Module

Responsibilities:

- schedule and cancel local reminders
- hand generated CSV exports to the platform share/save flow
- support local file selection for import

## Integration Notes

- Authentication depends on Backend Integration and Local Persistence.
- Sync depends on Local Persistence, Backend Integration, and Authentication.
- Import/Export depends on Accounts, Categories, Transactions, and Local Persistence.
- Dashboard and Analytics depend on derived queries, not stored summary tables.
- Onboarding and Settings share the same settings/accounts/reminder persistence.
- Profile metadata can reflect onboarding and preferred currency without moving ledger data to the backend.
- Import/export history stays operational and local-only.

## Future Expansion Notes

- conflict handling can now be layered on top of the active PowerSync foundation
- `public.profiles` can later be mirrored through the sync layer if auth bootstrap requirements change
- backend-assisted import/export can be added later without changing the current local-first flow

## Summary

The module boundaries now reflect a real local-first product with real authentication and a real sync foundation: Supabase owns identity and remote ownership, Drift remains the app-facing local ledger, PowerSync handles synchronization, and Riverpod keeps the layers coordinated without pushing backend concerns into widgets.
