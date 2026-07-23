# API Specification

*Monilog - Web Client and Supabase Contract*

## Purpose

This document records the backend-facing contract for the Monilog web application and the larger backend surface reserved for later phases.

## Current Backend Scope

Active now:

- Supabase Auth for email/password
- browser session restore
- Supabase `public.profiles` reads and upserts through the web client
- remote Postgres tables for synced ledger entities
- sync engine push and pull operations using the authenticated web client

Not active yet:

- Google OAuth authentication
- phone OTP authentication
- forgot password flow
- custom REST endpoints
- chatbot and webhook APIs
- advanced conflict-resolution UX

## Runtime Configuration

The web client reads backend configuration from Vite environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- optional `VITE_APP_ENV`

Important rule:

- only the publishable anon key is used in the browser client
- service-role keys are out of scope and must never ship to the browser

## Active Authentication Contract

Authentication is handled through the Supabase JavaScript client rather than custom `/auth/*` REST endpoints.

Supported client operations:

- email/password sign up
- email/password sign in
- sign out
- session restore on app load

Visible but intentionally inactive UI options:

- phone sign in and sign up through OTP
- OTP verification
- Google OAuth sign in and sign up

Expected bearer context:

```text
Authorization: Bearer <supabase-access-token>
```

## Active Profile Contract

The app-level user record lives in `public.profiles`.

Current columns:

- `id`
- `name`
- `email`
- `phone_number`
- `avatar_url`
- `onboarding_completed`
- `preferred_currency`
- `created_at`
- `updated_at`

Current client operations:

- select profile by authenticated `id`
- upsert profile after successful authentication
- update profile details after profile completion or app metadata changes

RLS rules:

- users can select only their own row
- users can insert only their own row
- users can update only their own row

## Ledger Sync Contract

Syncable tables:

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

Client behavior:

- local writes succeed in Dexie first
- each write creates or updates an outbox entry locally
- the sync engine pushes pending records to Supabase when the browser is online and authenticated
- the sync engine pulls remote changes and reconciles them into IndexedDB
- failed remote writes remain visible through local sync metadata

Recommended remote write shape:

```json
{
  "id": "txn_123",
  "user_id": "auth-user-uuid",
  "amount": 5000,
  "type": "expense",
  "updated_at": "2026-03-31T10:00:00Z"
}
```

## Auth and Profile Flow Contract

Runtime sequence:

1. Initialize Supabase with the configured project URL and anon key.
2. Open the local IndexedDB database through Dexie.
3. Check for an existing Supabase session.
4. If authenticated, upsert or fetch `public.profiles`.
5. Start sync only when authentication and connectivity conditions are met.
6. Route the user to profile completion, onboarding, or the main app.

Failure expectations:

- invalid credentials return clear auth errors
- missing profile table returns a setup error message
- disabled Google or phone options return a non-blocking coming-soon message
- missing sync readiness must not block local finance usage

## Ownership Expectations

The app aligns local business data with authenticated ownership:

- `accounts.user_id`
- `categories.user_id`
- `transactions.user_id`
- `settings.user_id`
- `notification_preferences.user_id`

Remote rows must remain protected by RLS on `user_id`.

## Future Endpoint Direction

If custom backend endpoints are added later, they should align with the current schema, ownership rules, and offline-first model.

Planned groups:

- `/accounts`
- `/categories`
- `/transactions`
- `/settings`
- `/notification-preferences`
- `/imports`
- `/exports`
- `/chatbot/*`

Important alignment rules:

- opening balances remain account properties, not synthetic income transactions
- analytics remain derived from transactions
- import/export operational history should not become canonical business records
- ownership must continue to anchor to the authenticated Supabase user id

## Recommended Response Shapes for Future APIs

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "error": true,
  "message": "Invalid input",
  "details": {}
}
```

## Status Codes

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request |
| `401` | Unauthorized |
| `403` | Forbidden by RLS or ownership rules |
| `404` | Not found |
| `409` | Conflict |
| `422` | Validation error |
| `500` | Server error |

## Summary

Monilog Web uses Supabase as its live backend contract for identity, profiles, and synced ledger continuity. The browser client remains local-first, but the authenticated Supabase layer provides the remote ownership and persistence boundary that the sync engine targets.
