# Coding Standards

*Finance Ledger Web*

## Purpose

This document defines coding standards for the current direct-Supabase React web app.

## Core Principles

- write for humans first
- keep components presentation-focused
- keep Supabase access inside services or repositories
- validate at form and service boundaries
- keep auth ownership explicit
- surface backend write failures clearly
- reserve browser storage for local-only data
- do not reintroduce the removed sync layer

## Project Organization

- route entry points live in `src/pages/`
- feature forms and schemas live in `src/features/`
- reusable UI primitives live in `src/components/`
- Supabase-backed repositories live in `src/db/repositories/`
- Supabase client setup lives in `src/lib/`
- external/service integrations live in `src/services/`
- app-facing state lives in focused Zustand stores under `src/store/`
- local-only browser persistence must be documented in the owning repository or service

## React Standards

- use functional components with typed props
- keep raw Supabase calls out of presentational components
- use hooks for reusable React behavior
- keep side effects in hooks, stores, or services
- show loading, empty, and error states for backend-backed UI
- do not add UI text that suggests offline shared-data saves

## Data Access Standards

- shared data reads go through repository/service functions
- shared data writes go directly to Supabase
- writes must use the current authenticated session and `user_id`
- never trust a caller-supplied `userId` over the active session
- rely on RLS as the backend ownership boundary
- use soft delete for active ledger removal where supported
- do not store shared business records as browser-only data

## Realtime Standards

- keep one realtime subscription per signed-in user
- centralize subscription setup in a service
- filter subscriptions by user-owned rows
- clean up subscriptions on logout or user change
- use realtime events to invalidate/refetch backend queries
- show reconnect/offline status without implying an offline mutation queue

## Local-Only Storage Standards

Allowed:

- import/export history
- temporary import mapping state
- dismissed local UI hints
- device notification permission state
- transient UI filters

Not allowed:

- accounts
- categories
- transactions
- transfers
- shared settings
- shared notification preferences
- profiles

## Supabase Standards

- centralize client creation
- never expose service-role credentials
- keep auth/profile/table access behind named services
- return domain-shaped objects from repositories
- translate Supabase errors into user-safe messages at UI boundaries
- keep migrations aligned with TypeScript types and docs

## Form and Validation Standards

- use React Hook Form for user-editable forms
- use Zod for validation schemas
- parse numeric inputs before persistence
- validate CSV rows before backend writes
- show validation and backend errors clearly

## Testing Expectations

- test financial calculations and balance derivation
- test transaction and transfer validation
- test CSV import parsing and duplicate handling
- test auth-aware state cleanup where practical
- test repository failure paths when adding risky data changes

## Removed Patterns

Do not add:

- Dexie business-data tables
- local outbox writes
- `sync_status` or `last_synced_at` fields
- "save locally, upload later" flows for shared records
- PowerSync or equivalent sync-layer code in this phase

## Summary

Finance Ledger Web should stay simple and direct: React UI, service/repository boundaries, Supabase as source of truth, realtime refresh, and local browser storage only for device-specific operational data.
