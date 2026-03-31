# Use Case Specification

*Finance Ledger - Smart Financial Tracking and Analytics Tool*

## Purpose

This document defines the major use cases currently supported or explicitly planned for Finance Ledger across the mobile app and later chatbot/backend channels.

## Scope

The use cases cover:

- user authentication
- profile creation and completion
- transaction entry through app and later chatbot channels
- transaction management
- dashboard and analytics access
- import and export operations

## Actors

- **Primary actor:** User
- **Supporting systems:** Mobile application, Supabase Auth, Supabase profile table, local database, file processing module, future chatbot/backend services

## Use Case List

| ID | Use Case | Primary Actor |
| --- | --- | --- |
| UC-01 | Register Account | User |
| UC-02 | Log In | User |
| UC-03 | Log Out | User |
| UC-04 | Add Transaction via Mobile App | User |
| UC-05 | Add Transaction via WhatsApp Chatbot | User |
| UC-06 | Edit Transaction | User |
| UC-07 | Delete Transaction | User |
| UC-08 | View Transaction List | User |
| UC-09 | Filter/Search Transactions | User |
| UC-10 | View Dashboard Summary | User |
| UC-11 | View Analytics | User |
| UC-12 | Request Financial Summary via Chatbot | User |
| UC-13 | Export Data | User |
| UC-14 | Import Data | User |

## Detailed Use Cases

### UC-01: Register Account

- **Description:** The user creates a new Finance Ledger account through Supabase authentication.
- **Preconditions:** The user does not already have an active authenticated session.
- **Trigger:** The user selects the register option.
- **Main flow:** Open registration screen -> choose email/password -> submit -> system validates -> Supabase account is created -> Finance Ledger ensures the `profiles` row exists after the first successful authenticated session -> profile completion is shown if needed -> onboarding begins.
- **Alternative flows:** Invalid input returns validation errors; duplicate account returns an account-exists message; email confirmation may be required; selecting Google shows a coming-soon snackbar; selecting phone opens the phone screen but the submit action still returns coming-soon guidance.
- **Postconditions:** A Supabase-authenticated account exists and the app can continue with profile completion or onboarding.

### UC-02: Log In

- **Description:** The user signs in to access Finance Ledger data.
- **Preconditions:** A valid user account exists.
- **Trigger:** The user submits email and password credentials.
- **Main flow:** Open login screen -> submit email/password -> system validates with Supabase -> authenticated session starts -> Finance Ledger loads or creates the `profiles` row -> system routes the user to profile completion, onboarding, or dashboard.
- **Alternative flows:** Invalid credentials return an error message; missing Supabase setup returns a configuration message; selecting Google shows a coming-soon snackbar; submitting the phone screen returns coming-soon guidance without entering an incomplete OTP flow.
- **Postconditions:** The user is authenticated and routed to the correct post-auth state.

### UC-03: Log Out

- **Description:** The user ends the current session securely.
- **Preconditions:** The user is logged in.
- **Trigger:** The user selects logout.
- **Main flow:** Tap logout -> system clears the Supabase session -> login screen is shown.
- **Postconditions:** The current session is terminated.

### UC-04: Add Transaction via Mobile App

- **Description:** The user records an income or expense through the app.
- **Preconditions:** The user is authenticated and a local workspace is available.
- **Trigger:** The user taps the add transaction action.
- **Main flow:** Open form -> enter amount -> choose type -> choose category -> optionally add description -> choose date -> save -> system validates -> transaction is stored locally -> dashboard refreshes.
- **Alternative flows:** Invalid amount returns validation errors; save failure returns a retry or failure message.
- **Postconditions:** The transaction is stored and available to analytics.

### UC-05: Add Transaction via WhatsApp Chatbot

- **Description:** The user logs an income or expense by sending a message.
- **Preconditions:** The user account exists and the chat identity is recognized.
- **Trigger:** The user sends a transaction message such as `-5000 food yesterday`.
- **Main flow:** Message arrives -> system identifies user -> parser extracts amount, type, category, and date -> system validates data -> transaction is stored -> confirmation is returned.
- **Alternative flows:** Unclear messages trigger clarification; missing category may fall back to a default; invalid parsed data is rejected safely.
- **Postconditions:** The transaction appears in the system and can be viewed in the app.

### UC-06: Edit Transaction

- **Description:** The user updates an existing transaction.
- **Preconditions:** The user is authenticated and the transaction exists.
- **Trigger:** The user opens a transaction and selects edit.
- **Main flow:** Open details -> edit fields -> save changes -> system validates -> transaction is updated -> summaries refresh.
- **Alternative flows:** Invalid values return validation errors.
- **Postconditions:** The saved transaction reflects the latest valid data.

### UC-07: Delete Transaction

- **Description:** The user removes a transaction from the system.
- **Preconditions:** The user is authenticated and the transaction exists.
- **Trigger:** The user selects delete.
- **Main flow:** Open details -> tap delete -> confirm -> system removes transaction -> summaries refresh.
- **Alternative flows:** The user cancels deletion and the record remains unchanged.
- **Postconditions:** The selected transaction is removed.

### UC-08: View Transaction List

- **Description:** The user reviews saved transaction history.
- **Preconditions:** The user is authenticated.
- **Trigger:** The user opens the transactions screen.
- **Main flow:** System loads transactions -> list is displayed -> user scrolls and reviews records.
- **Postconditions:** The user can view transaction history.

### UC-09: Filter/Search Transactions

- **Description:** The user narrows the transaction list using search or filters.
- **Preconditions:** The user is authenticated and transaction data exists.
- **Trigger:** The user enters search text or selects filter values.
- **Main flow:** Open filter controls -> choose date, category, type, or keyword -> system applies filters -> matching transactions are displayed.
- **Alternative flows:** If no records match, the system shows an empty state.
- **Postconditions:** The visible list reflects the selected filters.

### UC-10: View Dashboard Summary

- **Description:** The user views high-level financial information.
- **Preconditions:** The user is authenticated.
- **Trigger:** The user opens the dashboard.
- **Main flow:** System loads totals -> balance, income, expenses, and quick stats are displayed.
- **Postconditions:** The user sees an overview of current financial status.

### UC-11: View Analytics

- **Description:** The user views visual insights and trends.
- **Preconditions:** The user is authenticated and enough data exists to compute analytics.
- **Trigger:** The user opens the analytics screen.
- **Main flow:** System retrieves analytics data -> charts and summaries are displayed -> user reviews trends and breakdowns.
- **Alternative flows:** If there is not enough data, the system displays an empty or starter state.
- **Postconditions:** The user can interpret financial patterns visually.

### UC-12: Request Financial Summary via Chatbot

- **Description:** The user asks the chatbot for a quick financial summary.
- **Preconditions:** The user is recognized by the chatbot.
- **Trigger:** The user sends a summary query such as `balance` or `today`.
- **Main flow:** Chat request arrives -> system interprets intent -> relevant data is fetched -> summary reply is returned.
- **Alternative flows:** If the query is unclear, the system asks for clarification; if no data exists, the reply returns an empty or zero result safely.
- **Postconditions:** The user receives a concise summary through chat.

### UC-13: Export Data

- **Description:** The user exports financial records for backup, sharing, or analysis.
- **Preconditions:** The user is authenticated and records exist.
- **Trigger:** The user selects export.
- **Main flow:** Open export screen -> choose format -> optionally choose filters -> confirm -> system generates file -> file is returned to the user.
- **Alternative flows:** Unsupported format or generation failures return clear error messages.
- **Postconditions:** An export file is generated and made available.

### UC-14: Import Data

- **Description:** The user imports transactions from a supported file.
- **Preconditions:** The user is authenticated and the file format is supported.
- **Trigger:** The user selects import and uploads a file.
- **Main flow:** Open import screen -> choose file -> system validates structure -> user confirms import -> valid transactions are stored -> result summary is shown.
- **Alternative flows:** Invalid file structure or bad rows are rejected or skipped with clear reporting.
- **Postconditions:** Valid data is added to the system and dashboards can reflect the update.

## Relationship Notes

- UC-01 supports UC-02.
- UC-02 is required before most app-based use cases.
- UC-01 and UC-02 may lead into profile completion and onboarding before full app use.
- UC-04 and UC-05 both feed analytics and dashboard use cases.
- UC-06 and UC-07 affect summary and analytics outcomes.
- UC-13 and UC-14 support portability and migration workflows.

## Summary

The Finance Ledger use-case set now begins with real Supabase-backed identity, then moves into onboarding and daily finance management. Later chatbot and backend channels should extend that same authenticated ownership model.
