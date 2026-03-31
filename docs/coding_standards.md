# Coding Standards

*Project: Finance Ledger*

## Purpose

This document defines the coding standards for the Finance Ledger project across the mobile app, backend services, integrations, and shared utilities.

The goals are to keep the codebase:
- clean
- readable
- consistent
- scalable
- easy to maintain
- easy for multiple contributors to work in safely

## Core Principles

- Write for humans first.
- Prefer clarity over cleverness.
- Keep code consistent across modules.
- Give each file, class, and function one clear responsibility.
- Reuse code carefully without premature abstraction.
- Keep functions focused and small.
- Remove duplicate logic when repetition becomes real.
- Handle failures explicitly and clearly.

## Naming Conventions

### General Rules

- Use names that reveal intent.
- Avoid vague names such as `data`, `item`, or `temp` when better context is available.
- Use action-based names for functions and noun-based names for classes.

### Examples

| Good | Avoid |
| --- | --- |
| `createTransaction` | `doStuff` |
| `monthlyExpenseSummary` | `handleData` |
| `syncPendingEntries` | `tempFunc` |

### Language-Specific Style

- **Dart / Flutter:** use `snake_case` for files, `camelCase` for variables and methods, and `PascalCase` for classes and widgets.
- **TypeScript / JavaScript:** use team-approved `kebab-case` or consistent file naming, `camelCase` for variables and functions, and `PascalCase` for classes and React components.
- **Constants:** use `UPPER_SNAKE_CASE` where the language or team convention expects true constants.

## File Organization Rules

- Keep each file focused on one purpose.
- Split large files when they start mixing concerns.
- Keep feature-related code together.
- Move truly reusable code to shared locations, not everything that looks reusable at first glance.

## Formatting Standards

- Use automated formatters whenever possible.
- Run `dart format` for Dart and Flutter code.
- Use Prettier for JavaScript or TypeScript if those stacks are introduced.
- Run linting tools regularly such as `dart analyze` and ESLint where applicable.
- Avoid manual formatting that drifts from project tooling.

## Commenting Standards

Comments should explain **why**, not restate the obvious.

### Good Uses of Comments

- explaining non-obvious business rules
- documenting integration quirks
- clarifying temporary workarounds
- highlighting sync or parsing edge cases

### Poor Uses of Comments

- restating what the code already says
- keeping outdated notes after refactors
- leaving misleading TODOs without context

## Function and Class Standards

- Prefer guard clauses over deep nesting.
- Keep side effects obvious.
- Validate inputs close to the boundary.
- Separate UI concerns from business logic.
- Avoid huge service classes that own unrelated responsibilities.

## Error Handling Standards

- Fail early when required data is missing.
- Return actionable error messages where appropriate.
- Log integration failures clearly.
- Never silently swallow important exceptions.
- Handle user-facing errors in a helpful and non-technical way.

## Testing Expectations

- Test critical financial calculations.
- Test transaction validation and category matching.
- Test chatbot parsing rules and fallback behavior.
- Test import and export flows with valid and invalid samples.
- Add regression tests when fixing bugs.

## Git and Review Standards

- Keep commits focused and understandable.
- Prefer small, reviewable changes over large mixed commits.
- Do not merge code that has unclear naming, weak validation, or missing critical test coverage.
- Review for correctness, readability, maintainability, and regression risk.

## Summary

The standard for Finance Ledger is simple: write code that future contributors can understand quickly and extend safely.
