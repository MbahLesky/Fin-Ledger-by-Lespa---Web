# Import and Export Specification

## Import

CSV imports are previewed and validated in the browser before any backend write.

Required columns:

- `date`
- `type`
- `amount`
- `account`

Optional columns:

- `category`
- `note`

Confirmed imports:

- create missing accounts in Supabase when requested
- create missing categories in Supabase when requested
- create valid transactions in Supabase
- skip invalid or duplicate rows with a visible summary
- store import history locally only

## Export

Exports:

- read active Supabase transactions for the signed-in user
- generate a CSV in the browser
- use columns `date,type,amount,category,account,note`
- store export history locally only

## Local Data Boundary

Import/export history is local-only operational data. Imported financial records are shared backend records once confirmed.
