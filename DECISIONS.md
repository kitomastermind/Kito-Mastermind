# Decisions

Choices made under Section 0.4 of the Cursor execution plan. Open items from Section 22 use the documented default unless a later line records a change.

## Scaffold

- **Project root is `kito-mastermind/`.** `create-next-app` rejected the parent folder name `Kito` (npm package names cannot contain capital letters). The app lives in the nested directory specified in Section 4.
- **TypeScript target is ES2020.** The scaffold defaulted to ES2017, which cannot express `bigint` literals required for money.
- **`@eslint/js` is pinned to v9.** Latest resolved to v10, which targets ESLint 10. Section 3 locks ESLint 9.
- **`@testing-library/dom` is installed.** It is a required peer of the listed `@testing-library/react` package, not an extra library.

## Section 22 defaults (in force)

1. Cross-chapter matching is chapter-scoped.
2. Forum topics are network-wide; the feed defaults to the member's chapter with an All-chapters toggle.
3. The lead privacy toggle is always on and disabled.
4. Referral credit split defaults to 75 closer / 25 referrer, editable per deal.
5. Points weights are the Section 14.3 defaults (600 cap).
6. Nairobi dues default to 5,000 KES monthly and a 1,000 KES late-attendance fine until the chapter confirms otherwise.
7. Only Admin may create a Chapter Lead.
8. Pairing cadence is per cycle.
9. M-Pesa uses one shared paybill until the human configures otherwise; C2B matching stays conservative (no guessed allocations).
10. A leaving member is deactivated; grants where they are the grantee are revoked; their own leads and grants they gave are retained; contribution history is kept; they are excluded from chapter averages.

## Seed

- **`supabase/seed.ts` may write the `leads` table.** The repository does not exist until Phase 3, and seed is not a runtime read path. ESLint allows `.from('leads')` in `supabase/seed.ts` only. The invitation trigger is disabled while seed creates the first profiles, because `invitations.invited_by` requires an existing profile. `supabase db query` cannot disable `auth.users` triggers (not table owner), so seed uses `docker exec` as `supabase_admin` on the local `supabase_db_*` container.
- Seed helpers live under `supabase/seed/` so `seed.ts` stays under the file-length ceiling.

## Auth (Phase 2)

- **Login lockout lives in `login_attempts`, migration 010.** The plan specifies 5 failures / 15 minutes but does not name a table. Service-role writes only; no RLS client path. Audit actions `LOGIN_FAILED` and `LOGIN_LOCKED` were added to `audit_action` in the same migration.
- **Invitation emails skip send when `RESEND_API_KEY` is unset in non-production.** The Server Action still creates the invitation and, in development only, returns `inviteUrl` so the flow can be tested without Resend. Production without a key logs a warning and does not return the URL.

## Dev server

- **Webpack, not Turbopack, for `dev` and `build` on this Windows machine.** Turbopack panic-logged on `globals.css`, then served `/login` as 404 from a corrupted `.next` cache (`indexOf` on undefined in the Edge middleware chunk). Webpack is the conservative default until that panic is gone.
- Playwright talks to `http://localhost:3000` (not `127.0.0.1`) so Next does not treat the leak crawl as a cross-origin `/_next` request.

## Matching and grants (Phase 3)

- **Non-overlapping budget ranges get a 25% near-miss pad.** Direct overlap scores 28–32M vs 22–27M as 0 (total 53). Section 14.2 requires 61. Expanding each range by 25% of the narrower width, then scoring that overlap against the original narrower width, yields 0.25 and `Math.round(60.5) = 61`. Intersecting ranges still use the unpadded overlap.
- **Active grants are unique per (lead, grantee) via a partial index.** Migration 002's table-level unique would block a new grant after revocation. Migration 011 drops that constraint and adds `grants_one_active_idx` where `revoked_at is null`, matching “issue a new grant” in trigger 5.
