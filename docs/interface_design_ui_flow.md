# Interface Design and UI Flow

*Finance Ledger Web*

## Purpose

This document defines the current page flow and UX expectations for the direct-Supabase web app.

## Design Principles

- simple, fast finance capture
- clear authenticated state before ledger access
- shared backend data should feel current across devices
- no UI copy should imply offline shared-data saving
- import must preview before committing
- writes must show success or failure clearly
- empty states should work with real zero-data accounts
- responsive layouts must work on desktop and mobile browser widths

## Navigation Model

Primary destinations:

- Dashboard
- Transactions
- Add Transaction
- Transfer Money
- Analytics
- Settings / Profile
- Import Data
- Export Data

Responsive behavior:

- desktop uses persistent navigation
- compact widths use bottom navigation and condensed header actions
- Add Transaction remains prominent

## Auth Flow

### Session Restore

- shown while Supabase session is checked
- routes to signed-out, profile-completion, onboarding, or dashboard

### Login/Register

- email/password is active
- Google and phone entry points remain visible but guarded as later-phase options
- successful auth ensures profile and backend defaults

### Profile Completion

- shown when required profile fields are missing
- saves profile directly to Supabase

## Onboarding Flow

### Choose Currency

- user selects preferred currency
- setting is saved to Supabase
- default account currency is updated in Supabase
- profile preferred currency is updated

### Import Existing Records

- user chooses CSV
- app previews and validates rows
- user maps accounts/categories
- confirmed rows write directly to Supabase
- import history remains local-only

### Starting Balances

- Cash and Bank are seeded in Supabase when missing
- custom accounts are written to Supabase
- opening balances update backend account rows

### Daily Reminder

- shared reminder preference writes to Supabase
- browser notification permission remains device-specific
- onboarding completion updates profile/settings

## Main Pages

### Dashboard

Purpose:

- show current balance, totals, account summaries, quick actions, and recent activity

Behavior:

- reads backend data through repositories
- refreshes after Supabase Realtime events
- shows backend/reconnect state when needed
- does not show old sync status or pending-write counts

### Transactions

Purpose:

- searchable/filterable income, expense, and transfer history

Actions:

- edit transaction
- soft-delete transaction
- soft-delete transfer
- navigate to transfer/add transaction

Behavior:

- list data comes from Supabase
- delete confirmation explains backend-backed history
- errors are surfaced with toasts or inline messages

### Add Transaction

Purpose:

- fast manual entry for income and expense records

Fields:

- amount
- type
- category
- account
- date
- note

Behavior:

- validates client-side first
- writes directly to Supabase
- success confirms backend save
- offline/network failure is visible

### Transfer Money

Purpose:

- move funds between user-owned accounts without treating transfer amount as income or expense

Behavior:

- validates account difference, amount, fee, and source balance
- writes transfer row to Supabase
- transfer fees affect expense-side analytics

### Analytics

Purpose:

- show derived monthly trends and category concentration

Behavior:

- reads from backend transactions and transfers
- handles empty and error states safely

### Settings

Sections:

- profile/session
- currency
- theme
- reminders
- accounts and balances
- categories
- import/export
- reset data

Behavior:

- shared settings/preferences write to Supabase
- reset clears backend ledger data for the signed-in user and local import/export history
- sign-out clears auth and realtime state

### Import/Export

Import:

- preview, validate, map, confirm
- commit valid rows to Supabase
- local-only import history

Export:

- generate CSV from active Supabase transactions
- browser download
- local-only export history

## Realtime UX

The UI may show a backend connection banner when:

- the browser is offline
- realtime is connecting
- realtime reports an error

The copy must describe backend refresh/reconnect behavior, not queued sync.

## Future Extensions

- filtered exports
- richer account editing
- Google sign-in
- phone OTP
- server-assisted notifications
- offline sync may be reconsidered as a separate future architecture

## Summary

The interface still follows the same Finance Ledger user journey, but all shared data interactions now reflect direct Supabase reads/writes and realtime backend refresh.
