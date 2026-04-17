# Software Requirements Specification

*Finance Ledger Web*

## Scope

Finance Ledger Web supports authenticated personal finance tracking through a React frontend and Supabase backend.

## Functional Requirements

- users can register, sign in, restore sessions, and sign out
- users can complete profiles and onboarding
- users can manage accounts and opening balances
- users can manage categories
- users can create, edit, filter, and delete transactions
- users can create and delete transfers
- users can view dashboard summaries
- users can view analytics
- users can import CSV records after preview and mapping
- users can export active transactions to CSV
- users can manage shared settings and reminder preferences

## Data Requirements

- shared business data is stored in Supabase
- local-only data is limited to browser/device operational history and transient UI state
- RLS protects user-owned rows
- realtime events refresh open UI views

## Nonfunctional Requirements

- shared-data writes are online-first
- failures must be visible
- UI must remain responsive on desktop and mobile browser widths
- code must keep Supabase access outside leaf presentation components

## Out of Scope

- offline shared-data mutation queues
- chatbot workflows
- PowerSync or equivalent sync-layer work
