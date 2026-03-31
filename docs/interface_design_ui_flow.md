# Interface Design and UI Flow

*Finance Ledger*

## Purpose

This document defines the current mobile UI structure and the primary user flows after Supabase authentication and PowerSync foundation work were introduced.

## Design Principles

- simplicity first
- fast manual entry
- safe bulk import and export
- real empty states instead of demo placeholders
- clear auth state before entering the ledger
- one local source of truth for ledger data
- background sync should never block core entry and transaction flows

## Main Navigation

The primary bottom navigation contains:

- Dashboard
- Transactions
- Add
- Analytics
- Profile

## Screen Definitions

### Authentication Screens

**Auth Loading / Session Restore Screen**

- shown at app start while the session is checked
- displays a loading state such as `Restoring your session...`
- routes to signed-out, profile-completion, onboarding, or main-app flow

**Login Screen**

- email input
- password input
- login button
- Google sign-in button remains visible and shows a coming-soon snackbar when tapped
- phone sign-in entry point remains visible and routes into the phone screen
- register link
- auth-unavailable guidance when Supabase config is missing

**Register Screen**

- full name input
- email input
- password input
- confirm password input
- register button
- Google sign-up button remains visible and shows a coming-soon snackbar when tapped
- phone sign-up entry point remains visible and routes into the phone screen
- guidance about email confirmation when required by Supabase

**Phone Auth Screen**

- phone number input
- full name input for sign-up mode
- send verification action
- validation guidance for international phone format
- submit action currently shows a coming-soon snackbar instead of starting OTP delivery

**OTP Verification Screen**

- not active in this phase
- reserved for a later phone-auth milestone

**Profile Completion Screen**

- shown when authentication succeeds but the app profile is missing required fields
- editable name field
- editable phone field
- save and continue action

### Onboarding Screens

**Choose Your Currency Screen**

- title: `Choose Your Currency`
- selectable currency list
- `Start fresh` action
- `Import existing records` action
- selected currency is saved before the user continues into either setup path

**Import Existing Records Screen**

- available during onboarding before opening balances are finalized
- local CSV file picker
- CSV format guidance
- parsed row preview
- validation issues section
- account mapping controls
- category mapping controls
- import confirmation button
- import result summary
- `Continue setup` action after a successful import

**Set Starting Balances Screen**

- title: `Set Your Starting Balances`
- always shows Cash and Bank
- supports custom accounts such as MoMo
- reflects imported accounts if the user came from onboarding import
- skip or continue action
- balances are treated as opening balances, not transactions

**Daily Reminder Screen**

- title: `Stay on Track`
- reminder toggle
- time picker when enabled
- skip or continue action to finish onboarding

### Dashboard Screen

**Purpose**

- give a quick view of current balance, totals, accounts, and recent activity

**Sections**

- current balance
- total income
- total expenses
- today's spending
- account summary
- quick actions such as add transaction, history, analytics, and import data
- recent transactions

**Empty-state behavior**

- shows zero balance correctly
- keeps default/custom accounts visible
- prompts the user to import data or add the first transaction

### Transactions Screen

**Purpose**

- show searchable and filterable transaction history

**Elements**

- search
- type filter
- category filter
- account filter
- date filter
- transaction list

**Actions**

- tap for details
- long press to edit
- swipe to delete

**Empty-state behavior**

- explains that the user can add the first transaction or import a CSV

### Add Transaction Screen

**Purpose**

- support fast manual entry for income and expense records

**Layout**

- amount input
- income/expense toggle
- category selector
- account selector
- note field
- date selector
- save action

### Analytics Screen

**Purpose**

- show derived trends and breakdowns from stored transactions

**Behavior**

- works from local data only
- handles empty data safely with placeholder messaging

### Profile / Settings Screen

**Sections**

- authenticated profile/session information
- currency
- accounts and opening balances
- reminders
- theme preferences
- category management
- import data
- export data
- reset app data
- log out

### Import Screen

**Purpose**

- import historical finance records from a local CSV file

**MVP flow**

1. Choose local CSV file
2. Parse and validate headers and rows
3. Show preview and row issues
4. Match or create accounts and categories
5. Import valid rows only
6. Show summary and update dashboard/history/analytics automatically

### Export Screen

**Purpose**

- export all locally stored transactions into a CSV backup

**MVP flow**

1. Tap export
2. Generate CSV from Drift transactions
3. Open platform share/save sheet
4. Show success or failure feedback

## Textual User Flows

- first-time email sign-up: Register -> Supabase auth -> Profile row ensured -> Choose currency -> Start fresh or import -> Starting balances -> Optional reminders -> Dashboard
- phone sign-up option tapped: Register -> Phone screen -> Enter phone -> Submit -> Coming-soon snackbar -> User returns to email flow for active auth
- Google sign-in or sign-up option tapped: Login/Register -> Google button -> Coming-soon snackbar -> User stays in auth flow and uses email instead
- returning user with session: Splash -> Session restore -> Profile check -> Onboarding if incomplete or Dashboard if ready
- daily use: Open app -> Dashboard -> Add transaction or review history -> Analytics/Profile as needed
- later manual import: Profile -> Import data -> Choose CSV -> Preview and map -> Confirm import -> Updated ledger
- export backup: Profile -> Export data -> Generate CSV -> Save/share externally
- sign out: Profile -> Log out -> Supabase session cleared -> Login screen
- reset flow: Profile -> Reset app data -> Confirm -> Onboarding restarts with system defaults only

## UX Considerations

- import must never save rows silently without preview and confirmation
- invalid CSV rows should be visible and skippable
- duplicate handling should be conservative and transparent
- export should create a clean spreadsheet-friendly CSV
- auth states should always show progress and clear recovery messaging
- onboarding should happen only after the user has a real authenticated identity
- profile completion should be brief and only shown when required
- guarded auth methods should stay visible without leading into broken flows
- PowerSync should stay a background concern in this phase rather than a prominent new screen flow

## Future Extensions

- replace-all import mode with stronger confirmation
- filtered export by account or date range
- JSON/XLSX support
- Google sign-in activation
- phone OTP activation
- forgot password flow
- richer visible sync status once multi-device behavior is polished
- richer account profile editing after backend growth

## Summary

The UI flow now starts with real authentication, then moves into profile completion and onboarding only when needed. After that, users manage their finances in the same local-first ledger experience as before.
