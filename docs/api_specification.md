# API Specification

*Finance Ledger Web - Supabase Client Contract*

## Purpose

The web app currently uses Supabase client APIs directly from repository and service modules. There is no custom sync API contract in the web client.

## Active Backend Contracts

- Supabase Auth for email/password session management
- Supabase PostgREST for CRUD on shared tables
- Supabase Realtime for change notifications
- Row Level Security for ownership

## Shared Table Access

All shared business tables are accessed with the active Supabase session:

- `profiles`
- `accounts`
- `categories`
- `transactions`
- `transfers`
- `settings`
- `notification_preferences`

Business rows use `user_id`; profile rows use `id`.

## Write Contract

Shared-data writes:

- validate in the UI/service layer
- require an authenticated session
- require network access
- call Supabase directly
- return success only after Supabase accepts the write
- surface Supabase errors to the user

No web API should queue shared-data writes locally in this phase.

## Realtime Contract

The web app subscribes to Postgres changes filtered by the active user. Realtime events invalidate backend queries; they are not a separate data source.

## Local-Only Contract

Import/export audit history is stored locally in the browser. It is not synced and is not part of the backend API.

## Future APIs

Future server APIs may be added for chatbot, automation, or reporting. They must preserve the Supabase ownership model and must not reintroduce offline shared-data queues without a new approved architecture.
