# Authentication and User Management

*Finance Ledger - Supabase Auth Foundation with PowerSync Context*

## Purpose

This document explains why Supabase is being used, what is implemented in the current auth phase, how authenticated users map to the app-level profile record, and how auth now scopes PowerSync.

Current milestone date: **March 27, 2026**.

## Why Supabase Is Added Now

Finance Ledger already works offline with Drift and Riverpod. Supabase is being added now for identity, session management, and a durable remote user profile foundation without changing the app into a sync-first product too early.

This phase is intentionally limited to:

- real authentication
- session restore on app launch
- app-level profile storage in Supabase
- ownership-ready local records through `user_id`

This phase does **not** include:

- advanced conflict-resolution UX
- chatbot backend integration
- service-role usage in the Flutter client
- advanced backend automation

## Supported Authentication Methods

The app currently has one fully active Supabase-backed auth method:

- email and password

The following auth options remain visible in the UI, but they are not active in this phase and currently respond with non-blocking coming-soon guidance:

- phone number with OTP verification
- Google OAuth sign in / sign up

The Flutter client uses the Supabase publishable/anon key only.

## Configuration Model

Supabase is loaded from `lib/config/supabase_configuration.dart`.

The preferred override path is still Dart defines:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `POWERSYNC_URL`

Optional environment selector:

- `APP_ENV`

Example:

```text
flutter run --dart-define-from-file=env/supabase.local.json
```

For local development in this repository, the same config file also contains an embedded development fallback so the app can still initialize if those Dart defines are not passed.

Checked-in template:

- `env/supabase.example.json`

Local ignored file for real keys and PowerSync URL:

- `env/supabase.local.json`

Mobile redirect URL used by the app:

```text
com.finledger.app://login-callback
```

That redirect URL must be added to the Supabase Auth URL configuration and to the Google provider setup for mobile OAuth.

## Auth Flow in the App

### Launch and Session Restore

1. App starts.
2. Supabase initializes when configuration is present.
3. The auth session provider checks for an existing Supabase session.
4. If a session exists, the app restores it and ensures the profile row exists.
5. Routing then continues to:
   - profile completion if required
   - onboarding if not completed
   - dashboard if the user is already ready

### New User Flow

1. User registers with email and password.
2. Supabase authenticates the user when email confirmation rules allow it, or the user confirms email and signs in afterward.
3. Finance Ledger upserts a row in `public.profiles` using the authenticated user id.
4. If the profile is missing a required name, the app shows profile completion.
5. The user continues into onboarding or the main app.

### Returning User Flow

1. User opens the app with a valid session.
2. Supabase restores the session.
3. The app loads the matching `profiles` row.
4. The user resumes onboarding or enters the main app.

## Supabase Auth Users vs App-Level Profiles

These are different layers and must stay separate:

### `auth.users`

- managed by Supabase Auth
- stores authentication identity
- not written directly by the Flutter app
- source of the authenticated UUID returned by `auth.uid()`

### `public.profiles`

- managed by Finance Ledger application logic
- stores app-facing profile fields
- linked 1:1 to `auth.users.id`
- used for name, email, phone number, onboarding metadata, and future app preferences

The Flutter app never stores passwords, OTP secrets, refresh tokens, or service-role credentials in `public.profiles`.

## `profiles` Table Schema

Implemented in `supabase/migrations/20260326_auth_profiles.sql`.

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
- `email`
- `phone_number`
- `created_at`
- `updated_at`

Rules:

- `id` must match the authenticated Supabase user id
- a profile row is created or updated after successful authentication
- `email` or `phone_number` may be null depending on the auth method
- duplicate profile rows are prevented by the primary key

## Row Level Security

`public.profiles` has RLS enabled.

Current policies allow each authenticated user to:

- select only their own profile row
- insert only a row whose `id` equals `auth.uid()`
- update only their own profile row

This is the first ownership boundary that later sync and backend features now build on.

## Local Ownership Alignment

The Drift business tables already include nullable `user_id` columns:

- `accounts`
- `categories`
- `transactions`
- `settings`
- `notification_preferences`

During this phase:

- the signed-in user id is stamped into newly created local business records
- existing device data can be claimed by the first authenticated user on that device
- if a different user signs in on the same device, the local workspace and PowerSync sync state are reset to avoid cross-account data leakage

That reset behavior is intentional until full multi-device conflict handling is introduced.

## Auth and PowerSync

PowerSync now uses the active Supabase session as its authenticated sync context.

Current rules:

- PowerSync connects only when a valid Supabase session exists
- the Supabase access token is reused as the PowerSync client credential
- synced remote ledger rows are protected with `user_id = auth.uid()` RLS
- `public.profiles` remains direct Supabase auth/profile state rather than being moved into the PowerSync path in this phase

## Onboarding and Profile Completion

Auth and onboarding are now separate but connected:

- authentication establishes identity
- profile completion fills missing app-level fields
- onboarding sets currency, balances, and reminders

The `profiles` table may also store:

- `onboarding_completed`
- `preferred_currency`

These fields help the remote user record reflect app-level progress without turning the backend into the ledger source of truth yet.

## Setup Notes for Supabase Dashboard

Before testing auth, the project owner must configure:

- Email auth in Supabase Auth
- redirect URL `com.finledger.app://login-callback`

Optional later-phase setup:

- Phone auth and an SMS provider supported by Supabase
- Google provider credentials

## Later Scope

Planned for later phases:

- Google sign-in activation
- phone OTP activation
- forgot password flow
- richer conflict handling for synced ledger tables
- chatbot/backend workflows
- background jobs and notifications beyond local device reminders

## Summary

Supabase is now the authentication and user-profile foundation for Finance Ledger, and that authenticated identity also scopes PowerSync. Email and password remain the only active auth method, Google and phone remain visible as upcoming features, and the ledger stays local-first while authenticated sync is introduced carefully behind that same ownership model.
