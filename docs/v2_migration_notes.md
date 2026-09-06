# Monilog v2 — Web Migration Notes

The full cross-repo plan lives in the mobile repository:
`Monilog/docs/v2_architecture_plan.md`. This file records only what changes in
this repository, so it stays useful while working here.

## What v2 changes for the web app

Monilog v2 moves every client onto one backend: Supabase Postgres, with
PowerSync keeping local databases in sync. For the web app that means:

- **Firebase Auth → Supabase Auth.** Same flows (email/password, Google), new
  provider. Sign-in stays optional; local-only use remains supported.
- **Dexie + the custom Firestore sync engine → `@powersync/web`.**
  `src/services/sync-engine.ts`, `sync-checkpoints.ts` and `sync-merge.ts` are
  deleted; PowerSync owns pull, upload queueing, checkpoints and reconnects.
  Repositories read and write the PowerSync-backed SQLite store instead of Dexie.
- **A one-time Firestore → Postgres migration** for existing beta users, verified
  per user before Firestore is disabled.
- **Data shape aligns with mobile.** UUID `id` as the single identity (no
  `client_id`), money as `bigint` minor units at a fixed scale of 100,
  `deleted_at` soft deletes, `updated_at` in UTC driving last-write-wins.

Firebase Analytics is a separate decision from this migration — see the open
questions in the main plan.

## Doc status

`docs/dexie_supabase_sync_strategy.md` describes a Supabase sync engine this app
never shipped — it still runs on Firestore. It is retired by the v2 work and
should be replaced once Phase 5 lands.
