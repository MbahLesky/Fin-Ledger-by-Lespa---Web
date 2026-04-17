# Feasibility Study

## Current Assessment

Finance Ledger Web is feasible as a React + Supabase application with direct backend reads/writes and realtime refresh.

## Feasible Now

- email/password authentication
- shared ledger data through Supabase
- realtime refresh for backend changes
- dashboard, history, transfers, analytics, settings, import, and export
- local-only import/export history

## Main Risks

- network availability affects shared-data writes
- browser notification behavior varies by platform
- realtime availability depends on Supabase project configuration
- cross-device behavior requires matching mobile table contracts

## Mitigations

- show clear offline/write failure states
- keep Supabase access in repositories
- keep local-only data separate from shared records
- validate build, lint, and key user flows before release
