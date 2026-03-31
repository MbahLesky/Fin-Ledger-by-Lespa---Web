# Software Requirements Specification (SRS)

*Finance Ledger - Smart Financial Tracking & Analytics Tool*

## Purpose

This document defines the functional and non-functional requirements for Finance Ledger.

## Scope

Finance Ledger enables users to:
- log income and expenses
- record transactions through the mobile app and WhatsApp chatbot
- view summaries and analytics
- import and export financial records

The system is designed to be simple, fast, and accessible.

## System Overview

### Architecture at a Glance

The platform consists of:
- a Flutter mobile app
- a WhatsApp chatbot
- a backend API
- a persistent database

### User Roles

The MVP supports one primary user role: **User**.

## Functional Requirements

### Authentication

- The system shall allow a user to register.
- The system shall allow a user to log in.
- The system shall maintain a secure authenticated session.
- The system shall allow a user to log out.

### Transaction Management

- The system shall allow users to create income and expense transactions.
- The system shall validate amount, type, category, and date input.
- The system shall allow users to edit saved transactions.
- The system shall allow users to delete transactions with confirmation.
- The system shall provide transaction history with filtering and search.

### Chatbot Functionality

- The system shall allow users to log transactions through natural chat input.
- The chatbot shall extract amount, type, category, and date when possible.
- The chatbot shall request clarification when the message is incomplete or ambiguous.
- The chatbot shall support quick summary requests such as balance and daily totals.

### Categories and Accounts

- The system shall provide categories for income and expense classification.
- The system shall allow user-defined categories.
- The system should support simple account labels such as cash, bank, and mobile money.

### Account Initialization

- The system shall allow a user to set starting balances during onboarding. (M)
- The system shall always provide Cash and Bank as the default balance fields. (M)
- The system shall allow a user to add one or more custom Other accounts during onboarding. (M)
- The system shall require a name for each custom Other account before that account is saved. (M)
- The system should preserve one empty Other-account input row after a custom account is added so the user can continue adding more. (S)
- The system shall allow the user to skip the starting balances step during onboarding. (M)
- The system should treat onboarding balances as opening balances for the user's accounts. (S)

### Currency Preferences

- The system shall allow a user to select a preferred currency during onboarding. (M)
- The system shall store the selected currency in app state. (M)
- The system shall use the selected currency across dashboard, transaction, analytics, and starting-balance displays. (M)

### Notifications

- The system shall allow a user to enable daily reminder notifications. (M)
- The system shall allow a user to set a reminder time. (M)
- The system shall allow a user to disable or update the reminder later. (M)

### Dashboard and Analytics

- The system shall show balance, total income, and total expense summaries.
- The system shall provide daily, weekly, and monthly summaries.
- The system should show category and trend-based analytics.

### Import and Export

- The system shall allow import from supported file formats.
- The system shall validate file structure and reject invalid data safely.
- The system shall allow export using filters such as date range and category.

## Non-Functional Requirements

### Performance

- Common app actions should feel responsive on mobile devices.
- Dashboard summary retrieval should be fast enough for regular use.
- Chatbot replies should return in a reasonable time for conversational interaction.

### Security

- User data shall be protected through authenticated access.
- Passwords shall never be stored in raw form.
- API endpoints shall validate input and protect against malformed requests.
- File uploads shall be validated before processing.

### Reliability

- Transactions shall not be duplicated accidentally.
- Import operations shall provide clear success and failure reporting.
- Chatbot parsing failures shall not silently create incorrect transactions.

### Usability

- Transaction entry should require minimal steps.
- The UI shall remain intuitive for non-technical users.
- Error messages shall be understandable and actionable.

### Scalability

- The backend shall support new client channels such as web or desktop in the future.
- The architecture should support additional chatbot platforms later.

## Data Requirements

The system requires storage for:
- users
- accounts
- user preferences including currency and notification settings
- categories
- transactions
- import records
- export records
- chatbot identities

## Integration Requirements

- A messaging provider is required for WhatsApp-based chatbot flows.
- The mobile app and chatbot must communicate through the same backend core.
- Analytics must derive from the same transaction source of truth.

## Constraints

- MVP scope must remain focused.
- The chatbot depends on third-party platform capabilities and pricing.
- Multi-platform support beyond mobile is future scope.

## Summary

Finance Ledger should deliver a fast and understandable financial tracking experience centered on quick entry, clear insight, and a shared backend foundation.
