# DuneStack Places — Enterprise Readiness Roadmap

> Status as of 2026-06-29. This document assesses the current local-only MVP against
> what "enterprise-grade" requires, and lays out a phased plan to get there.

---

## 1. Where the app is today

DuneStack Places is a **deliberately local-only MVP**. A user photographs a place,
the app auto-geotags it, and saves it with a title, category, notes, tags, rating,
and favorite flag.

| Concern | Current state |
| --- | --- |
| Storage | On-device SQLite (`src/database/database.ts`) + filesystem images (`src/files/localImages.ts`) |
| Accounts | None — single anonymous user per device |
| Sync / backup | None implemented (settings screen says "planned next") |
| Networking | None — no API, no telemetry, no remote calls |
| Tests | Jest unit/integration tests for `placeValidation` and `placeRepository` |
| CI/CD | GitHub Actions runs ESLint, `tsc --noEmit`, and Jest on push/PR |
| Schema versioning | `CREATE TABLE IF NOT EXISTS` only — no migration path |
| Crash/error reporting | None |

This is a solid MVP. "Enterprise" raises the bar on **data durability, multi-user
access, security/compliance, supportability, and release rigor**. The gaps below are
what stand between the two.

---

## 2. Gap analysis (grounded in the current code)

### 2.1 Critical — blocks enterprise adoption

1. **No accounts or identity.**
   Every device is an island with one anonymous user. Enterprises need
   authenticated users, org/team membership, and (usually) SSO/SAML or OIDC.
   *Today there is no concept of a user anywhere in the schema or code.*

2. **No backup or sync — data dies with the device.**
   `app/settings.tsx` itself says manual export/import is "planned next." If a phone
   is lost, every saved place is gone. Enterprises require durable, recoverable data.

3. **No data export / portability.**
   Even without full sync, users and admins expect to export their data
   (GDPR "right to data portability", offboarding, audits). `expo-sharing` and
   `expo-document-picker` are already dependencies but unused for this.

4. **No schema migration strategy.**
   `initializeDatabase()` only runs `CREATE TABLE IF NOT EXISTS`. The moment you ship
   v2 with a new column, existing users' databases won't get it and the app will
   break on read/write. You need versioned migrations (`PRAGMA user_version`).

5. **No automated tests.**
   Zero unit, integration, or E2E coverage. Enterprise change-management demands a
   regression safety net before you can ship confidently or onboard contributors.

### 2.2 High — security & compliance

6. **Data at rest is unencrypted.**
   SQLite and the photo files are plain on disk. For regulated data, adopt
   SQLCipher (via `op-sqlite` or `expo-sqlite` with an encryption key stored in the
   device keychain via `expo-secure-store`).

7. **Location & PII handling has no consent/retention policy.**
   The app stores precise GPS (6-decimal lat/long in `app/place/[id].tsx`) plus
   photos that may contain faces/plates. Enterprise privacy needs an explicit consent
   record, a retention/auto-purge policy, and a documented data-flow.

8. **No audit trail.**
   `created_at`/`updated_at` exist, but there's no record of *who* did *what*.
   Enterprise/compliance typically requires an immutable audit log.

9. **IDs are not collision-safe for sync.**
   `createLocalId` in `placeRepository.ts` uses `Math.random()`. Fine for a single
   device; risky once records from many devices merge. Move to UUID v4
   (`crypto.randomUUID()` / `expo-crypto`).

### 2.3 Medium — reliability & operability

10. **No crash/error reporting or analytics.**
    You're blind to production failures. Add Sentry (errors) and a privacy-respecting
    analytics layer with explicit opt-in (the current "no analytics" stance is a
    *feature* — make it a configurable, consented one for enterprise).

11. **`initializeDatabase()` is called on every repository operation.**
    See every function in `placeRepository.ts`. It re-opens the DB and re-runs DDL on
    each create/list/get/update/delete. Initialize once at app start (it already is,
    in `app/_layout.tsx`) and reuse a single connection.

12. **No centralized data-access error handling.**
    `getPlaceById` throws raw `Error`; screens each reinvent `try/catch` + `Alert`.
    A repository result type or a shared error boundary would standardize this.

13. **No offline-first conflict resolution (needed once sync exists).**
    When sync lands, you need last-write-wins or CRDT-style merge rules, plus a
    `deleted_at` soft-delete column for tombstones.

### 2.4 Low — polish & housekeeping

14. **Dead boilerplate `App.tsx`.**
    The entry point is `expo-router/entry` (per `package.json`), so the default
    `App.tsx` is unused and misleading. Delete it.

15. **Duplicated Android permissions in `app.json`.**
    `CAMERA`, `ACCESS_COARSE_LOCATION`, and `ACCESS_FINE_LOCATION` are each listed
    twice. Harmless but sloppy — dedupe.

16. **No accessibility.**
    `Pressable`s lack `accessibilityRole`/`accessibilityLabel`; no Dynamic Type
    handling. Enterprise procurement often requires WCAG / Section 508 conformance.

17. **No internationalization.**
    All strings are hardcoded English. Add an i18n layer (e.g. `i18next`) if you
    target multiple regions.

18. **No linting/formatting config in the repo.**
    Add ESLint + Prettier + `tsc --noEmit` so style and type safety are enforced.

---

## 3. Recommended target architecture

```
┌─────────────────────────────────────────────────────────┐
│  Mobile app (Expo / React Native)                        │
│                                                          │
│  UI (expo-router screens)                                │
│        │                                                 │
│  Domain / repository layer  ──►  Local SQLite (cache)    │
│        │                              │                  │
│  Sync engine  ◄──────────────────────┘                  │
│        │  (queue, conflict resolution, tombstones)      │
└────────┼─────────────────────────────────────────────────┘
         │ HTTPS (authenticated)
         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (e.g. Supabase / custom API)                    │
│   • Auth (OIDC/SSO) + org/team model                     │
│   • Postgres w/ Row-Level Security per org               │
│   • Object storage for photos (signed URLs)              │
│   • Audit log + retention jobs                           │
└─────────────────────────────────────────────────────────┘
```

Keep the **local-first UX** (the app's current strength) and layer sync on top, so it
still works offline and feels instant.

> Supabase is a natural fit here (Postgres + Auth + Storage + RLS, and there's already
> a Supabase MCP connected to this workspace). It is a recommendation, not a
> requirement — a custom API works equally well.

---

## 4. Phased delivery plan

### Phase 0 — Foundations (1–2 weeks)
*Do these first; they're cheap and unblock everything else.*
- [x] Add ESLint + Prettier + `tsc --noEmit`; wire into a GitHub Actions CI job.
      (`eslint.config.js`, `.prettierrc`, `tsc --noEmit` via `npm run typecheck`,
      `.github/workflows/ci.yml`)
- [x] Add a unit-test harness (Jest + `@testing-library/react-native`). Start with
      `placeValidation.ts` and `placeRepository.ts`.
      (`jest.config.js` + tests in `src/places/`)
- [x] Introduce schema **migrations** keyed off `PRAGMA user_version`.
      (`src/database/migrations.ts` + `src/database/database.ts`)
- [x] Switch IDs to UUID v4 (`expo-crypto`). (`createLocalId` in `placeRepository.ts`)
- [x] Delete dead `App.tsx` and `index.ts`; dedupe Android permissions in `app.json`.
- [x] Initialize the DB once (remove per-call `initializeDatabase()`).

### Phase 1 — Data durability & portability (2–3 weeks)
- [x] Implement **manual export** — single JSON backup with photos embedded as
      base64, shared via `expo-sharing`. (`src/backup/backupService.ts`)
- [x] Implement **import** (`expo-document-picker`) with `zod` validation.
      (`src/backup/backupService.ts` + `backupTypes.ts`; additive restore via
      `importPlace` in `placeRepository.ts`)
- [x] Add soft-delete (`deleted_at`) so deletes survive a future sync.
      (migration v2; reads filter `deleted_at IS NULL`, `deletePlace` tombstones)

> Note: export embeds images as base64 in one JSON file rather than zipping the
> raw SQLite db + image files. This keeps the backup self-contained and adds no
> new dependencies; revisit zipping if backup size becomes a concern.

### Phase 2 — Identity & backend (3–5 weeks)
- [ ] Stand up backend (Auth + Postgres + object storage).
- [ ] Add org/team/user model with Row-Level Security.
- [ ] Add SSO/OIDC (the typical enterprise gate).

### Phase 3 — Sync engine (3–5 weeks)
- [ ] Outbound queue + pull/merge with last-write-wins + tombstones.
- [ ] Photo upload to object storage with signed URLs; local cache stays.
- [ ] Conflict UX for edge cases.

### Phase 4 — Security, compliance, observability (ongoing)
- [ ] Encrypt SQLite at rest (SQLCipher) + key in `expo-secure-store`.
- [ ] Consent capture + data-retention/auto-purge policy.
- [ ] Immutable audit log.
- [ ] Sentry crash reporting + opt-in analytics.
- [ ] Accessibility pass (WCAG 2.1 AA) and i18n.

### Phase 5 — Release engineering
- [ ] EAS Build + EAS Update (OTA) pipelines.
- [ ] Staged rollouts, versioned release notes, MDM distribution
      (Intune / Jamf) for enterprise app stores.

---

## 5. Quick wins you can ship this week

These are low-risk, high-signal, and need no backend:

1. Delete `App.tsx` and dedupe permissions in `app.json`.
2. Add `tsc --noEmit` + ESLint to CI.
3. Add `PRAGMA user_version` migrations — **this is the single most important
   change**, because without it you cannot safely evolve the app at all.
4. Implement export/import — gives users data durability immediately.
5. Move `initializeDatabase()` out of every repository call.

---

## 6. Open questions for product/leadership

Answering these shapes Phases 2–4:

- **Who is the "enterprise" user?** Individual employees, or shared team workspaces?
- **What data sensitivity tier?** (Drives encryption/compliance scope: GDPR, HIPAA,
  SOC 2, etc.)
- **Is offline use required**, or is always-connected acceptable?
- **Distribution:** public app stores, or private/MDM enterprise distribution?
- **Identity provider:** which IdP must SSO integrate with (Entra ID, Okta, Google)?
