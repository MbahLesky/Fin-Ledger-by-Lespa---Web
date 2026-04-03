# Authentication and User Management

*Finance Ledger - Supabase Auth for the Web Client*

## Purpose

This document explains how Finance Ledger uses Supabase authentication and app-level profile records in the web version of the product.

## Why Supabase Is Used

Finance Ledger remains local-first for finance data, but it still needs:

- secure identity
- browser session restore
- a durable remote user profile
- authenticated ownership boundaries for synced ledger data

Supabase provides those capabilities without changing the product into a remote-only application.

## Supported Authentication Methods

Fully active in the current web direction:

- email and password

Visible in the UI but intentionally inactive in the current phase:

- phone number with OTP verification
- Google OAuth sign in and sign up

The web client uses only the Supabase publishable anon key.

## Configuration Model

Supabase configuration is loaded from environment variables exposed to Vite.

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional variables:

- `VITE_APP_ENV`
- `VITE_ENABLE_PWA`

Example local setup:

```text
.env.local
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

If OAuth is activated later, Supabase redirect URLs must include the production web origin, preview origins as needed, and any local development URL used by Vite.

## Auth Flow in the App

### Launch and Session Restore

1. Browser app starts.
2. Supabase initializes when configuration is present.
3. The session bootstrap checks for an existing authenticated session.
4. If a session exists, the app ensures the profile row exists.
5. Routing continues to profile completion, onboarding, or dashboard.

### New User Flow

1. User registers with email and password.
2. Supabase authenticates the user when email confirmation rules allow it, or the user confirms email and signs in afterward.
3. Finance Ledger upserts a row in `public.profiles` using the authenticated user id.
4. If the profile is missing required fields, the app shows profile completion.
5. The user continues into onboarding or the main app.

### Returning User Flow

1. User opens the app or installed PWA with a valid session.
2. Supabase restores the session.
3. The app loads the matching `profiles` row.
4. The user resumes onboarding or enters the main app.

## Supabase Auth Users vs App-Level Profiles

These are different layers and must stay separate.

### `auth.users`

- managed by Supabase Auth
- stores authentication identity
- source of the authenticated UUID returned by `auth.uid()`

### `public.profiles`

- managed by Finance Ledger application logic
- stores app-facing profile fields
- linked 1:1 to `auth.users.id`
- used for name, email, phone number, onboarding metadata, and preferred currency

Finance Ledger never stores passwords, OTP secrets, refresh tokens, or service-role credentials in `public.profiles`.

## `profiles` Table Schema

Fields:

- `id UUID PRIMARY KEY`
- `name TEXT NULL`
- `email TEXT NULL`
- `phone_number TEXT NULL`
- `avatar_url TEXT NULL`
- `onboarding_completed BOOLEAN NOT NULL DEFAULT false`
- `preferred_currency TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Required app-profile fields in the current auth phase:

- `id`
- `name`
- `created_at`
- `updated_at`

Rules:

- `id` must match the authenticated Supabase user id
- a profile row is created or updated after successful authentication
- duplicate profile rows are prevented by the primary key

## Row Level Security

`public.profiles` has RLS enabled.

Policies should allow each authenticated user to:

- select only their own profile row
- insert only a row whose `id` equals `auth.uid()`
- update only their own profile row

This ownership boundary matches the syncable business tables that also use `user_id = auth.uid()`.

## Local Ownership Alignment

The local syncable tables include nullable `user_id` fields:

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

When a session exists:

- newly created local business records are stamped with the authenticated user id
- pending writes are scoped to that authenticated workspace
- remote sync uses the same ownership model

## Auth and Sync Relationship

Sync uses the active Supabase session as its authenticated context.

Rules:

- sync runs only when a valid Supabase session exists
- remote ledger rows are protected with `user_id = auth.uid()` RLS
- `public.profiles` remains a direct auth/profile concern rather than going through the ledger sync outbox

## Onboarding and Profile Completion

Auth and onboarding are separate but connected.

- authentication establishes identity
- profile completion fills missing app-level fields
- onboarding sets currency, balances, and reminders

`public.profiles` may reflect onboarding progress and preferred currency without becoming the source of truth for ledger data.

## Setup Notes for Supabase Dashboard

Before testing auth, the project owner should configure:

- email auth in Supabase Auth
- site URL for the deployed web app
- local development redirect URLs

Optional later-phase setup:

- phone auth and an SMS provider supported by Supabase
- Google provider credentials

## Later Scope

Planned for later phases:

- Google sign-in activation
- phone OTP activation
- forgot password flow
- richer conflict handling for synced ledger tables
- chatbot and backend workflows

## Summary

Supabase is the authentication and user-profile foundation for Finance Ledger Web. The ledger remains local-first in IndexedDB, but authenticated identity and ownership come from Supabase so the product can support session restore, remote continuity, and future multi-device use.
