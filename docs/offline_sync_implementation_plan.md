# Superseded: Offline Sync Implementation Plan

This implementation plan is no longer active for Finance Ledger Web.

## Current Decision

The web app is online-first for shared business data in the current phase. Shared records are read from and written to Supabase directly. Offline mutation queues are out of scope.

## Removed Scope

- local outbox
- pending write retries
- sync metadata fields
- IndexedDB business-data source
- background reconciliation

## Current Offline Behavior

- the app shell may load from cached static assets
- local-only import/export history may remain readable
- shared-data reads and writes require a valid backend connection
- failed shared-data writes must show clear feedback

## Future Note

Offline sync may be reconsidered later as a new architecture. It must not reuse the removed implementation by default.
