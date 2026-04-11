# Development Plan

*Finance Ledger - Web Application Delivery Plan*

## Introduction

Finance Ledger is still being delivered in layers so the product stays useful while the implementation direction shifts from the earlier mobile-first plan to an offline-first web application.

The product scope does not change:

- finance tracking remains the core purpose
- onboarding, balances, reminders, transaction tracking, analytics, and CSV portability remain in scope
- WhatsApp chatbot and backend workflows remain future extension points

Only the implementation path changes:

- React + TypeScript + Vite for the frontend shell
- Tailwind CSS and shadcn/ui for the interface construction
- React Router for navigation
- Zustand for app-facing state orchestration
- Dexie + IndexedDB for local-first persistence
- Supabase Auth + PostgreSQL for authenticated cloud continuity
- PWA installability and service-worker caching for offline browser use

## Guiding Principles

- keep the app usable at every phase
- make the browser app work offline for core finance actions
- save locally first and sync remotely second
- keep feature modules stable while implementation details change
- introduce cloud sync only after local correctness is reliable
- keep remote concerns out of page and component code

## Delivery Phases

### Phase 1: Web App Shell and Routing

Status: planned

Deliverables:

- Vite application scaffold with React + TypeScript
- app shell layout for desktop and mobile browser widths
- React Router route tree for auth, onboarding, dashboard, transactions, analytics, settings, import, and export views
- global providers for theme, auth session bootstrapping, and route guards
- shadcn/ui and Tailwind foundation

Success indicators:

- browser app loads reliably in development and production
- main routes are reachable with guarded auth flow
- responsive layout works on mobile and desktop screens

### Phase 2: UI Foundation and Responsive Pages

Status: planned

Deliverables:

- auth pages
- onboarding wizard pages
- dashboard page
- transactions page and transaction dialog/page
- analytics page
- settings/profile page
- import/export pages

Success indicators:

- the full product flow is visible in the browser
- pages use shared UI primitives consistently
- mobile-width and desktop-width navigation both feel coherent

### Phase 3: Local IndexedDB Persistence

Status: planned

Deliverables:

- Dexie database schema for accounts, categories, transactions, settings, notification preferences, import records, export records, and sync metadata
- local-first repositories for CRUD operations
- idempotent bootstrap for default accounts, categories, and settings
- derived query helpers for dashboard and analytics

Success indicators:

- data survives reloads and browser restarts
- onboarding defaults seed correctly without demo transactions
- derived balances and analytics read from persisted local source data

### Phase 4: Local CRUD, Search, and Filtering

Status: planned

Deliverables:

- create, edit, soft-delete, filter, and search transaction flows
- transfer money flow with account-to-account movement and fee handling
- account and category management
- onboarding balance setup
- reminder preference persistence
- Zustand stores coordinating page state with Dexie-backed repositories

Success indicators:

- all core finance interactions work without network dependency
- transaction history updates immediately after local writes
- transfer history and account balances update immediately after local writes
- filters and summaries stay consistent after edits and deletes

### Phase 5: CSV Import / Export Portability

Status: planned

Deliverables:

- browser-based CSV import with preview, validation, mapping, and summary
- append-first import behavior
- export to downloadable CSV
- local import/export audit history

Success indicators:

- users can migrate real historical records safely
- import never writes malformed rows silently
- exports are spreadsheet-friendly and re-importable

### Phase 6: Supabase Auth and Remote Profile Foundation

Status: planned

Deliverables:

- Supabase Auth session bootstrap in the web app
- email/password sign up and sign in
- guarded Google and phone entry points retained in UI for later activation
- `public.profiles` creation and update flow
- session-aware routing for signed-out, profile-completion, onboarding, and signed-in states

Success indicators:

- sessions restore on browser refresh
- authenticated users get a stable app-level profile row
- local workspace ownership aligns with the signed-in user

### Phase 7: Offline-First Sync Foundation

Status: planned

Deliverables:

- outbox-based sync engine from Dexie to Supabase
- sync metadata fields on local business records
- push/pull cycle for accounts, categories, transactions, settings, and notification preferences
- reconnect detection and retry handling
- basic conflict handling rules documented and implemented

Success indicators:

- local writes continue offline
- pending records sync when connectivity returns
- sync failures remain visible and retryable

### Phase 8: Reports, Charts, and Insight Views

Status: planned

Deliverables:

- Recharts-based trend and category breakdowns
- dashboard summaries derived from local source data
- account balance views
- empty states for low-data and no-data cases

Success indicators:

- charts render from local data without waiting on remote fetches
- analytics stay consistent with transaction history
- performance remains acceptable on common laptop and mobile browsers

### Phase 9: PWA Installability and Offline Caching

Status: planned

Deliverables:

- web app manifest
- service worker caching for the app shell and static assets
- install prompt support where browsers allow it
- offline loading for previously cached routes and assets

Success indicators:

- the app can be installed as a PWA
- cached assets allow the shell to load without network
- users can continue using core local finance features while offline

### Phase 10: Hardening, Testing, and Deployment

Status: planned

Deliverables:

- unit and integration coverage for calculations, validation, import/export, and sync behavior
- browser compatibility checks
- performance and accessibility review
- Vercel deployment pipeline
- environment and release documentation

Success indicators:

- the production build deploys cleanly to Vercel
- core flows are covered by repeatable automated tests
- the app remains usable under offline and reconnect scenarios

## Recommended Implementation Order

1. App shell and routing
2. Auth pages and route guards
3. Dashboard, transactions, analytics, and settings pages
4. Dexie local schema and repositories
5. Offline CRUD flows and onboarding persistence
6. Transfer module integration across balances, history, and analytics
7. Supabase integration and profile provisioning
8. Sync engine and reconnect handling
9. Reports and charts
10. PWA manifest and service-worker caching
11. Polish, testing, and deployment

## Risks to Watch

- browser notification behavior varies across platforms
- IndexedDB schema migrations must remain deterministic
- sync conflicts need a simple rule set before multi-device usage expands
- export and import flows must behave well across different browser download/file APIs

## Summary

The web delivery plan preserves the original Finance Ledger product while changing the build path to a browser-first, installable, offline-capable application. The next implementation focus is the local web shell and IndexedDB foundation, followed by authenticated sync and PWA hardening.
