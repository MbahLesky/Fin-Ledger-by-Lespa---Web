# Import / Export Specification

*Finance Ledger - CSV MVP*

## Purpose

This document defines the current offline-first CSV import and export behavior for the web application.

## Scope

Included in MVP:

- local CSV import
- import preview and validation
- account and category mapping
- append-only import behavior
- duplicate detection within the file and conservative duplicate checks against existing local data
- CSV export of all transactions
- local import/export history

Out of scope:

- cloud backup as a user-facing backup feature
- backend-assisted import
- bank API import
- XLSX or JSON support
- OCR or receipt import
- sync-aware merge UX

## CSV Format

### Required Columns

- `date`
- `type`
- `amount`
- `account`

### Optional Columns

- `category`
- `note`

### Supported Values

- `date`: `YYYY-MM-DD`
- `type`: `income` or `expense`
- `amount`: numeric and greater than zero
- `account`: plain text account name
- `category`: plain text category name
- `note`: plain text

### Exported Column Order

```text
date,type,amount,category,account,note
```

## Import Flow

1. User opens Import Data from onboarding or settings.
2. User chooses a local CSV file through the browser file picker.
3. App parses the file locally.
4. App validates headers and rows.
5. App shows preview counts and invalid-row details.
6. App builds account and category mappings.
7. User confirms mapping choices.
8. App imports valid rows only into Dexie and IndexedDB.
9. App records a local import history entry.
10. Dashboard, transactions, and analytics update from the stored data.

## Validation Rules

- empty files are rejected
- duplicate headers are rejected
- missing required headers block import
- fully empty data rows are ignored
- invalid rows are shown and skipped
- exact duplicates later in the same file are skipped
- likely duplicates already in the local database may be skipped conservatively using:
  - `date`
  - `type`
  - `amount`
  - `account`
  - `note`

## Mapping Behavior

### Accounts

- case-insensitive exact name match -> use existing account
- unknown account -> default to `create new`
- user may remap to an existing account before import

### Categories

- case-insensitive exact name match plus transaction type -> use existing category
- unknown category -> default to `create new`
- blank category -> user must map to an existing category before import

## Import Mode

Current mode:

- append only

Future-safe extension:

- replace-all mode may be added later with strong confirmation and clear safeguards

## Export Behavior

- export reads all active transactions from local IndexedDB
- export generates a CSV file in the browser
- export downloads the file locally
- export records a local export history entry

Default filename pattern:

```text
finance_ledger_export_YYYY-MM-DD.csv
```

## Error Handling

- invalid file content returns a user-readable error
- import never silently saves malformed rows
- DB write failures leave existing stored data unchanged
- export failures do not modify stored transactions

## Future Extensions

- filtered export by date range or account
- stronger duplicate review tooling
- replace-all import mode
- XLSX and JSON formats
- backend and sync-aware portability once online features expand

## Summary

Import is designed to help users bring real historical records into the app safely. Export is designed to give users a clean CSV backup they can download, analyze, or re-import later.
