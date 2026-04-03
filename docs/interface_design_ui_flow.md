# Interface Design and UI Flow

*Finance Ledger Web*

## Purpose

This document defines the page structure, responsive behavior, and primary user flows for the Finance Ledger web application.

## Design Principles

- simplicity first
- fast manual entry
- safe bulk import and export
- real empty states instead of demo placeholders
- clear auth state before entering the ledger
- local-first behavior must not disappear behind sync status
- responsive layouts for laptop, tablet, and mobile browser widths


The complementary brand, color, theme, and copy direction now lives in `brand_visual_language.md`.

## Navigation Model

The web application uses route-based navigation.

Primary destinations:

- Dashboard
- Transactions
- Add Transaction
- Analytics
- Settings / Profile

Responsive behavior:

- desktop and large tablet layouts use a persistent sidebar or top navigation
- compact widths use a bottom navigation or condensed header actions
- the Add Transaction action remains prominent regardless of layout

## Page Definitions

### Authentication Pages

**Auth Loading / Session Restore View**

- shown at app start while the browser session is checked
- displays a loading state such as `Restoring your session...`
- routes to signed-out, profile-completion, onboarding, or main-app flow

**Login Page**

- email input
- password input
- login button
- Google sign-in button remains visible and shows a coming-soon message when tapped
- phone sign-in entry point remains visible and routes into the phone page
- register link
- auth-unavailable guidance when Supabase config is missing

**Register Page**

- full name input
- email input
- password input
- confirm password input
- register button
- Google sign-up button remains visible and shows a coming-soon message when tapped
- phone sign-up entry point remains visible and routes into the phone page
- guidance about email confirmation when required by Supabase

**Phone Auth Page**

- phone number input
- full name input for sign-up mode
- send verification action
- validation guidance for international phone format
- submit action currently shows a coming-soon message instead of starting OTP delivery

**OTP Verification Page**

- not active in the current web phase
- reserved for a later phone-auth milestone

**Profile Completion Page**

- shown when authentication succeeds but the app profile is missing required fields
- editable name field
- editable phone field
- save and continue action

### Onboarding Pages

**Choose Your Currency Page**

- title: `Choose Your Currency`
- selectable currency list
- `Start fresh` action
- `Import existing records` action
- selected currency is saved before the user continues into either setup path

**Import Existing Records Page**

- available during onboarding before opening balances are finalized
- browser file picker
- CSV format guidance
- parsed row preview
- validation issues section
- account mapping controls
- category mapping controls
- import confirmation button
- import result summary
- `Continue setup` action after a successful import

**Set Starting Balances Page**

- title: `Set Your Starting Balances`
- always shows Cash and Bank
- supports custom accounts such as MoMo
- reflects imported accounts if the user came from onboarding import
- skip or continue action
- balances are treated as opening balances, not transactions

**Daily Reminder Page**

- title: `Stay on Track`
- reminder toggle
- time picker when enabled
- browser notification permission guidance
- skip or continue action to finish onboarding

### Dashboard Page

Purpose:

- give a quick view of current balance, totals, accounts, and recent activity

Sections:

- current balance
- total income
- total expenses
- today's spending
- account summary
- quick actions such as add transaction, history, analytics, and import data
- recent transactions
- sync status banner when there are pending or failed writes

Empty-state behavior:

- shows zero balance correctly
- keeps default and custom accounts visible
- prompts the user to import data or add the first transaction

### Transactions Page

Purpose:

- show searchable and filterable transaction history

Elements:

- search
- type filter
- category filter
- account filter
- date filter
- transaction list or table

Actions:

- open detail panel or page
- edit from row actions
- delete with confirmation

Empty-state behavior:

- explains that the user can add the first transaction or import a CSV

### Add Transaction View

Purpose:

- support fast manual entry for income and expense records

Presentation options:

- modal or drawer on desktop
- full page or sheet on smaller screens

Layout:

- amount input
- income or expense toggle
- category selector
- account selector
- note field
- date selector
- save action

### Analytics Page

Purpose:

- show derived trends and breakdowns from stored transactions

Behavior:

- reads from local data first
- handles empty data safely
- adapts chart layout for narrower screens

### Settings / Profile Page

Sections:

- authenticated profile and session information
- currency
- accounts and opening balances
- reminders
- theme preferences
- category management
- import data
- export data
- reset app data
- log out

### Import Page

Purpose:

- import historical finance records from a local CSV file

MVP flow:

1. Choose local CSV file
2. Parse and validate headers and rows
3. Show preview and row issues
4. Match or create accounts and categories
5. Import valid rows only
6. Show summary and update dashboard, history, and analytics automatically

### Export Page

Purpose:

- export all locally stored transactions into a CSV backup

MVP flow:

1. Open export page
2. Generate CSV from locally stored transactions
3. Download file through the browser
4. Show success or failure feedback

## Textual User Flows

- first-time email sign-up: Register -> Supabase auth -> profile row ensured -> choose currency -> start fresh or import -> starting balances -> optional reminders -> dashboard
- phone sign-up option tapped: Register -> Phone page -> enter phone -> submit -> coming-soon message -> user returns to email flow for active auth
- Google sign-in or sign-up option tapped: Login/Register -> Google button -> coming-soon message -> user stays in auth flow and uses email instead
- returning user with session: App load -> session restore -> profile check -> onboarding if incomplete or dashboard if ready
- daily use: Open app or installed PWA -> dashboard -> add transaction or review history -> analytics/settings as needed
- later manual import: Settings -> Import data -> choose CSV -> preview and map -> confirm import -> updated ledger
- export backup: Settings -> Export data -> generate CSV -> download file
- sign out: Settings -> Log out -> Supabase session cleared -> login page
- reset flow: Settings -> Reset app data -> confirm -> onboarding restarts with system defaults only

## UX Considerations

- import must never save rows silently without preview and confirmation
- invalid CSV rows should be visible and skippable
- duplicate handling should be conservative and transparent
- export should create a clean spreadsheet-friendly CSV
- auth states should always show progress and clear recovery messaging
- onboarding should happen only after the user has a real authenticated identity
- profile completion should be brief and only shown when required
- sync should remain a background system until the user needs retry or status visibility
- desktop layouts may show more data density, but the feature flow must match the mobile-width experience

## Future Extensions

- replace-all import mode with stronger confirmation
- filtered export by account or date range
- JSON or XLSX support
- Google sign-in activation
- phone OTP activation
- forgot password flow
- richer visible sync history and conflict resolution
- richer account profile editing after backend growth

## Summary

The interface flow still starts with authentication, profile completion, and onboarding, then moves into the same ledger, analytics, settings, and portability flows already defined for Finance Ledger. The difference is that those experiences are now delivered as responsive web pages and PWA views across screen sizes.
