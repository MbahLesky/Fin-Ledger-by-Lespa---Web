# Web Transfer Feature Specification

*Finance Ledger Web*

## Purpose

This document defines the Transfer Money feature for the web application and keeps behavior aligned with the shared mobile product model.

## Feature Goals

- move funds between user-owned accounts
- preserve account-level balance correctness
- keep transfer amount separate from income and expense classification
- support local-first save and sync-ready metadata
- expose transfers in history with clear visual distinction

## Data Model

Transfer record fields:

- `id`
- `user_id`
- `from_account_id`
- `to_account_id`
- `amount`
- `fee`
- `note`
- `transfer_date`
- `created_at`
- `updated_at`
- `deleted_at`

Sync metadata mirrors other syncable tables (`remote_id`, `sync_status`, `sync_error`, `last_synced_at`).

## Web UI Flow

Entry points:

- sidebar/bottom navigation `Transfer`
- dashboard quick action `Transfer money`
- transactions page header action `Transfer`

Transfer form fields:

- from account
- to account
- amount
- fee (optional)
- date
- note

Form behavior:

- source account available balance is shown inline
- destination list excludes the selected source account
- submit stays disabled while invalid
- loading state appears while saving
- success feedback appears after local save

## Validation Rules

- `from_account_id` must not equal `to_account_id`
- amount must be greater than zero
- fee must be zero or greater
- required fields must be present
- source account balance must be greater than or equal to `amount + fee`

## Balance Behavior

When transfer is created:

- source account balance decreases by `amount + fee`
- destination account balance increases by `amount`
- transfer amount is not treated as income or expense
- fee contributes to expense-side totals and charts

## History Behavior

Transfers appear in the same history view as transactions with distinct semantics:

- type badge: `Transfer`
- path text: `From -> To` (example: `Cash -> MoMo`)
- amount shown with transfer currency context
- fee shown when greater than zero
- transfer rows are not styled as income or expense

## Analytics Behavior

- transfer amount is excluded from income totals
- transfer amount is excluded from expense totals
- transfer fees are included in expense totals
- monthly trend and category breakdown include transfer fees under `Transfer fees`

## Local-First and Sync Readiness

- transfer saves write to IndexedDB first
- transfer operations enqueue outbox entries for sync
- ownership stamping and reset flow include transfers
- remote mapping uses a dedicated `transfers` table

## Consistency Notes (Mobile and Web)

- same transfer entity semantics across clients
- same validation boundaries for source/destination, amount, and fee
- same rule that transfer amount is not income/expense
- same local-first write behavior with sync metadata
