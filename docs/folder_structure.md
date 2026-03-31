# Folder Structure

*Project: Finance Ledger*

## Overview

This document describes the current Flutter project structure after the Drift persistence work, Supabase auth foundation integration, and PowerSync sync-layer integration.

The repository is still a single Flutter app at the root, but the internal structure now separates:

- app foundations
- local persistence
- sync integration
- backend/auth configuration
- feature modules
- shared UI
- deployment-ready Supabase SQL artifacts

## Current Root Structure

```text
fin_ledger/
|-- android/
|-- ios/
|-- web/
|-- windows/
|-- docs/
|-- lib/
|-- supabase/
|   `-- migrations/
|-- test/
|-- pubspec.yaml
`-- README.md
```

## `lib/` Structure

```text
lib/
|-- config/
|-- core/
|   |-- constants/
|   |-- database/
|   |   |-- daos/
|   |   `-- tables/
|   |-- enums/
|   |-- models/
|   |-- sync/
|   |-- supabase/
|   `-- theme/
|-- features/
|-- routes/
|-- services/
|-- shared/
|-- utils/
`-- main.dart
```

## `lib/config/`

Key auth/backend configuration lives here.

Representative files:

- `app_config.dart`
- `supabase_configuration.dart`

Responsibilities:

- app-wide constants and design configuration
- environment-aware Supabase configuration values
- environment-aware PowerSync configuration values

## `lib/core/database/`

This folder contains the local persistence foundation.

```text
lib/core/database/
|-- app_bootstrap.dart
|-- app_database.dart
|-- app_database_initializer.dart
|-- database_ids.dart
|-- database_provider.dart
|-- database_value_mappers.dart
|-- daos/
`-- tables/
```

Responsibilities:

- Drift database definition
- DAO boundaries
- schema initialization and migration
- seed/reset coordination
- local workspace ownership assignment
- value serialization helpers

## `lib/core/sync/`

This folder contains the PowerSync integration layer.

Representative files:

- `powersync_database_factory.dart`
- `powersync_provider.dart`
- `powersync_schema.dart`
- `supabase_powersync_connector.dart`

Responsibilities:

- open the PowerSync database on the same SQLite file used by Drift
- define the syncable raw-table schema
- manage auth-aware sync lifecycle through Riverpod
- keep uploads inside a dedicated sync connector instead of widget-level backend writes

## `lib/core/supabase/`

This folder contains the shared Supabase access foundation.

Representative files:

- `supabase_provider.dart`

Responsibilities:

- expose environment-backed Supabase configuration
- expose the initialized Supabase client through Riverpod
- keep direct SDK access centralized

## `lib/features/`

Features remain the main product modules.

Representative structure:

```text
features/
|-- accounts/
|-- analytics/
|-- app/
|-- auth/
|-- categories/
|-- chatbot/
|-- dashboard/
|-- import_export/
|-- onboarding/
|-- settings/
`-- transactions/
```

Each feature keeps its own:

- models
- services
- state/providers
- UI screens/widgets

The `auth/` feature now includes:

- session models
- validators and error mapping
- Supabase auth/profile services
- auth screens for email, profile completion, a guarded phone flow, and future Google/phone expansion points

## `supabase/migrations/`

This folder stores SQL artifacts that must be applied in Supabase.

Current usage:

- creation of the `public.profiles` table
- RLS policies for user-owned profile access
- creation of remote ledger tables and publication setup for PowerSync

## Architecture Placement Rules

- Widgets stay inside feature UI folders.
- Riverpod state remains inside feature state folders.
- Drift schema and DAOs live in `lib/core/database/`.
- PowerSync schema, connectors, and sync providers live in `lib/core/sync/`.
- Supabase client access lives in `lib/core/supabase/`.
- Environment/config loading lives in `lib/config/`.
- Cross-feature device integrations stay in `lib/services/`.
- Reusable visual building blocks stay in `lib/shared/`.
- Supabase SQL setup belongs in `supabase/migrations/`, not inline in app code.

## Why Database Code Lives in `core`

The Drift layer is a shared application foundation rather than a single feature.

It belongs in `core` because it supports:

- accounts
- categories
- transactions
- settings
- imports/exports
- authenticated ownership alignment

while still allowing each feature to expose its own Riverpod-facing behavior.

## Future Growth Direction

If the repository later expands into a multi-project setup, this Flutter app can still move into a `mobile_app/` folder and the Supabase SQL can move into a backend workspace without changing the internal module boundaries defined here.

## Summary

The current structure keeps the codebase feature-first while centralizing shared persistence, sync, and auth/backend foundations in predictable places.
