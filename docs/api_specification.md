# API Specification

*Finance Ledger - Active Supabase Auth and PowerSync Backend Contract*

## Purpose

This document records the backend-facing contract that exists today and the larger backend surface that remains for later phases.

## Current Backend Scope

Current date context: **March 27, 2026**.

Active now:

- Supabase project initialization in Flutter
- Supabase Auth for email/password
- Supabase session restore on app launch
- Supabase `public.profiles` reads and upserts through the Flutter client
- PowerSync client integration in Flutter
- auth-aware PowerSync connection management
- remote ledger table migrations for synced business data

Not active yet:

- Google OAuth authentication
- phone OTP authentication
- forgot password flow
- custom REST endpoints
- chatbot/backend APIs
- final conflict-handling UX

## Runtime Configuration

The Flutter client reads backend configuration from Dart defines:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `POWERSYNC_URL`
- optional `APP_ENV`

Important rule:

- only the publishable/anon key is used in the mobile client
- service-role keys are out of scope and must not be shipped in the app

## Active Authentication Contract

Authentication is currently handled through the Supabase Flutter SDK rather than a custom `/auth/*` REST layer.

Supported client operations:

- email/password sign up
- email/password sign in
- sign out
- session restore on launch

Visible but intentionally inactive UI options:

- phone sign in / sign up through OTP
- OTP verification
- Google OAuth sign in / sign up

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

- `select` profile by authenticated `id`
- `upsert` profile after successful authentication
- `update` profile details after profile completion or app metadata changes

RLS rules:

- users can select only their own row
- users can insert only their own row
- users can update only their own row

## Auth and Profile Flow Contract

Current runtime sequence:

1. Initialize Supabase with the configured project URL and publishable key.
2. Open the local SQLite database through PowerSync and Drift.
3. Check for an existing Supabase session.
4. If authenticated, upsert or fetch `public.profiles`.
5. If `POWERSYNC_URL` is configured, connect PowerSync using the Supabase JWT.
6. Route the user to profile completion, onboarding, or the main app.

Failure expectations:

- invalid credentials return clear auth errors
- missing profile table returns a setup error message
- disabled Google or phone options return a non-blocking `coming soon` message without faking authentication
- missing or invalid PowerSync setup must not break local app usage

## Active PowerSync Contract

PowerSync uses the Supabase access token as its client auth credential in this phase.

Current syncable tables:

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

Current behavior:

- Drift remains the app-facing read/write layer
- PowerSync tracks local changes from the same SQLite database
- uploads are applied through a dedicated PowerSync connector using Supabase table upserts/deletes
- remote rows are protected by RLS on `user_id`
- if `POWERSYNC_URL` is absent, the app remains local-only

## Ownership Expectations for Local and Future Remote Data

The current app already aligns local business data with authenticated ownership:

- `accounts.user_id`
- `categories.user_id`
- `transactions.user_id`
- `settings.user_id`
- `notification_preferences.user_id`

That ownership alignment is now shared by both the local data model and the remote synced tables.

## Future Endpoint Direction

When custom backend endpoints are added later, they should align with the current local schema, current ownership rules, and the PowerSync-mediated sync path.

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

Finance Ledger now has a real backend contract for identity, profiles, and syncable ledger tables. Email and password remain the active auth method, `public.profiles` remains the direct auth/profile table, and PowerSync now provides the sync pathway between the existing local-first app and Supabase/Postgres.
