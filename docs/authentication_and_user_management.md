# Authentication and User Management

*Finance Ledger - Supabase Auth for the Web Client*

## Purpose

This document explains how authentication drives direct Supabase data access in the web app.

## Supported Authentication

Active:

- email/password through Supabase Auth

Visible but inactive:

- Google OAuth
- phone OTP

## Auth Responsibilities

Supabase Auth provides:

- secure identity
- browser session restore
- access token for RLS-protected table access
- `auth.uid()` ownership for shared ledger rows

Finance Ledger manages:

- app-level `public.profiles`
- route guards
- onboarding state
- backend default seeding
- sign-out cleanup

## Auth Flow

1. App starts and checks for an existing Supabase session.
2. If no session exists, signed-out routes are shown.
3. If a session exists, the profile service ensures `public.profiles`.
4. Workspace bootstrap seeds backend settings, default accounts, and user-owned default categories when missing.
5. Realtime subscriptions start for the signed-in user.
6. Route guards send the user to profile completion, onboarding, or dashboard.

## Profile vs Auth User

### `auth.users`

- managed by Supabase
- source of authenticated UUID
- not accessed directly by app UI

### `public.profiles`

- managed by Finance Ledger
- one row per authenticated user
- stores display/profile and onboarding metadata

Profile fields:

- `id`
- `name`
- `email`
- `phone_number`
- `avatar_url`
- `onboarding_completed`
- `preferred_currency`
- `created_at`
- `updated_at`

## Ownership Rules

Shared business rows use:

- `user_id = auth.uid()`

Profile rows use:

- `id = auth.uid()`

The web app also filters reads by the active user where appropriate, but RLS is the authoritative boundary.

## Sign-Out Cleanup

On sign-out:

- Supabase session is cleared
- auth store clears session, user, and profile
- realtime state is reset
- realtime channel cleanup occurs through provider effects
- backend query hooks stop returning prior user data

## Removed Auth/Sync Relationship

The previous auth-scoped sync outbox is removed. Auth now scopes direct Supabase CRUD and realtime subscriptions. There is no local pending-write queue in the web app.

## Summary

Authentication establishes the user identity used for profile access, backend row ownership, realtime filtering, and clean user switching. Supabase is the shared data boundary for the web app.
