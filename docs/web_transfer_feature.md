# Web Transfer Feature

## Purpose

The transfer feature moves money between user-owned accounts while keeping transfer amount separate from income and expense records.

## Current Data Behavior

- transfers are written directly to Supabase
- transfers are scoped by authenticated `user_id`
- transfer changes refresh through Supabase Realtime
- no local queue is used

## Validation

- source account is required
- destination account is required
- source and destination must differ
- amount must be greater than zero
- fee must be zero or greater
- source balance must cover amount plus fee

## Balance Impact

- source account decreases by amount plus fee
- destination account increases by amount
- transfer amount is excluded from income/expense totals
- fee contributes to expense-side analytics

## UI Behavior

- transfer rows appear in history with a dedicated transfer badge
- row label shows source and destination account path
- transfer forms show source balance and total debit
- failed backend writes show a clear error
