# Superseded: Dexie and Supabase Sync Strategy

This document is retained only as historical context. The Dexie-to-Supabase sync strategy is no longer the active web architecture.

## Current Decision

Finance Ledger Web has removed:

- Dexie as a shared business-data source
- local mutation outbox
- sync status metadata
- pull checkpoints
- write-locally-then-upload behavior

## Replacement

The active model is documented in:

- `web_data_architecture.md`
- `system_architecture.md`
- `database_schema.md`

Current shared-data flow:

```text
React UI
-> repository/service
-> Supabase CRUD
-> Supabase PostgreSQL
-> Supabase Realtime
-> backend query refetch
```

## Local Data Boundary

Browser storage is now local-only for device/operational concerns such as import/export history. It is not used for accounts, transactions, transfers, categories, settings, profiles, or shared notification preferences.

## Summary

Do not use this old sync strategy for implementation. It was removed because the current priority is reliable shared backend data across web and mobile.
