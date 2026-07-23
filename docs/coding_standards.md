# Coding Standards

*Project: Monilog Web*

## Purpose

This document defines the coding standards for the Monilog web application across frontend code, local persistence, sync logic, Supabase integration, and shared utilities.

## Core Principles

- write for humans first
- prefer clarity over cleverness
- keep code consistent across features
- give each file, component, hook, and service one clear responsibility
- keep local-first behavior explicit in data-writing code
- validate inputs at the form or service boundary
- keep browser, sync, and backend details out of simple UI components

## Naming Conventions

### General Rules

- use names that reveal intent
- avoid vague names such as `data`, `item`, or `temp` when better context is available
- use action-based names for functions and noun-based names for types and components

### TypeScript Style

- use `kebab-case` for filenames unless the codebase adopts a stronger convention for specific file types
- use `camelCase` for variables, functions, hooks, and store actions
- use `PascalCase` for React components, TypeScript types, and Zod schemas exported as named objects
- use `UPPER_SNAKE_CASE` for true compile-time constants

## Project Organization Rules

- keep route entry points in `src/pages/`
- keep feature-specific code inside `src/features/`
- keep reusable UI primitives in `src/components/`
- keep Dexie schema, repositories, and local migrations in `src/db/`
- keep Supabase and external SDK setup in `src/lib/` or `src/services/`
- keep app-facing state in focused Zustand stores under `src/store/`

## React and Component Standards

- prefer functional components with TypeScript props
- keep presentational components free of direct persistence and Supabase calls
- co-locate small feature-only components with their feature
- lift shared UI only when reuse is real
- use route/page components to compose feature sections, not to own all business logic
- keep side effects in hooks or services rather than inline across render code

## Hook Standards

- custom hooks should start with `use`
- hooks should encapsulate reusable React behavior, not become hidden service layers for every domain operation
- keep hooks deterministic and dependency-safe
- prefer returning clear named fields over opaque tuples unless the pattern is obvious

## Zustand Standards

- stores should hold UI-facing state, orchestration state, and user-triggered actions
- stores should not replace Dexie as the durable source of truth
- avoid copying entire persistent datasets into long-lived store state when a repository query or live subscription is more appropriate
- expose selectors for frequently consumed slices to reduce unnecessary rerenders

## Form and Validation Standards

- use React Hook Form for user-editable forms
- use Zod for schema validation and input parsing
- keep validation schemas close to the feature that owns them
- map validation errors into user-readable messages
- validate imported CSV data before it reaches persistence code

## Supabase Standards

- create and share Supabase clients through a centralized setup module
- never scatter raw environment reads across components
- keep auth, profile, and remote sync operations inside services or repositories
- never expose service-role credentials in the web client
- rely on RLS and authenticated ownership instead of trusting client-only filters

## Dexie and Sync Standards

- Dexie repositories own local CRUD boundaries
- all syncable writes must succeed locally before being enqueued for remote sync
- sync metadata fields such as `sync_status`, `sync_error`, and `last_synced_at` must be updated consistently
- use soft delete for syncable entities unless a documented exception exists
- schema migrations must be explicit, tested, and reversible in intent

## Routing Standards

- define route constants centrally
- use route guards for signed-out, onboarding, and protected areas
- avoid hard-coded route strings spread across features
- align page URLs with product language users understand

## Formatting and Tooling

- use Prettier for formatting
- use ESLint for linting
- use TypeScript strictness appropriate for production code
- avoid manual formatting that drifts from project tooling

## Commenting Standards

Comments should explain **why**, not restate the obvious.

Good uses:

- non-obvious finance rules
- sync edge cases
- browser capability constraints
- import/export quirks

Poor uses:

- restating the code
- keeping outdated notes after refactors
- leaving TODOs without clear intent

## Testing Expectations

- test critical financial calculations
- test transaction validation and category matching
- test import and export flows with valid and invalid samples
- test sync queue and retry behavior
- test onboarding persistence and route guards
- add regression tests when fixing bugs

## Review Standards

- keep changes focused and understandable
- prefer small, reviewable changes over mixed rewrites
- do not merge code with unclear naming, weak validation, or missing critical test coverage
- review for correctness, readability, maintainability, offline behavior, and sync risk

## Summary

The coding standard for Monilog Web is simple: keep the React code clean, keep persistence boundaries explicit, keep sync logic disciplined, and make the offline-first behavior easy for future contributors to understand and extend.
