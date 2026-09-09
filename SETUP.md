# KITO Mastermind setup

Handoff document for the human operator. The agent writes migrations, auth paths, storage code and cron handlers. You create the cloud projects, fill secrets and deploy.

## 1. Local prerequisites

- Node 20 LTS (local machines on newer Node work for development; production should stay on 20)
- pnpm 9+
- Docker Desktop (required for local Supabase)
- Supabase CLI (installed as a project devDependency; `pnpm exec supabase`)

```bash
cd kito-mastermind
cp .env.example .env.local
pnpm install
pnpm exec supabase start
pnpm seed
```

Demo accounts (local seed only) share the password `Kito-Demo-2026!`.

| Email | Role |
|---|---|
| `grace.wanjiru@kito.test` | Treasurer (primary demo) |
| `daniel.otieno@kito.test` | Member, Grace's partner |
| `amara.njeri@kito.test` | Member, matching seller |
| `amina.hassan@kito.test` | Nairobi Chapter Lead |
| `james.gitonga@kito.test` | Admin |

## 2. Environment variables

Every variable in `.env.example` must exist in `.env.local` (development) and in Vercel (production). None of the `SUPABASE_*` or `CRON_SECRET` values may be committed.

| Variable | Where you get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page | Safe for the browser; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page | Server only. Never prefix `NEXT_PUBLIC_` |
| `SUPABASE_DB_URL` | Supabase → Project Settings → Database | Used by the CLI and `pnpm seed` |
| `NEXT_PUBLIC_APP_URL` | Your domain, or `http://localhost:3000` | Used in invite links and emails |
| `CRON_SECRET` | You generate | 32 random bytes, hex or base64. Guards `/api/cron/*` |
| `ENCRYPTION_KEY` | You generate | 32-byte key, base64-encoded. Encrypts CRM tokens at rest |
| `RESEND_API_KEY` | Resend dashboard | Transactional email |
| `EMAIL_FROM` | Resend + your domain | Must be a verified sender |
| `SUPABASE_STORAGE_BUCKET` | You create | Default name: `kito-files` |
| `MPESA_ENABLED` | You decide | Keep `false` until Daraja sandbox works |
| `MPESA_ENV` | `sandbox` or `production` | |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja portal | |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja portal | |
| `MPESA_SHORTCODE` | Safaricom | Paybill / till |
| `MPESA_PASSKEY` | Safaricom | STK password material |
| `MPESA_CALLBACK_URL` | Public HTTPS URL | `/api/webhooks/mpesa/stk` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project | Browser + server |
| `SENTRY_AUTH_TOKEN` | Sentry | Source map upload; CI only |

Generate local secrets:

```bash
# CRON_SECRET
openssl rand -hex 32

# ENCRYPTION_KEY (32 bytes, base64)
openssl rand -base64 32
```

## 3. Supabase project

1. Create a project (region closest to Nairobi; `eu-central-1` is the usual choice).
2. From this repo: `pnpm exec supabase link --project-ref <ref>`
3. Push schema: `pnpm exec supabase db push`
   (Local alternative: `pnpm exec supabase db reset`, which reapplies every migration through `20260101000016_matchable_pool_rpc.sql` — closed-business insert, rate limits, admin writes, and the matchable-leads RPC.)
4. Generate types after every schema change: `pnpm gen:types`

Local development:

```bash
pnpm exec supabase start
pnpm exec supabase status
pnpm seed
```

`pnpm seed` refuses to run against a `supabase.co` host unless `ALLOW_REMOTE_SEED=true` is set.

## 4. Supabase Auth dashboard settings

Configure these exactly. The app is invitation-only; do not enable public signup.

| Setting | Value |
|---|---|
| Email provider | Enabled |
| Confirm email | Enabled |
| Secure email change | Enabled |
| Site URL | `NEXT_PUBLIC_APP_URL` |
| Redirect URLs | `{APP_URL}/auth/callback`, `{APP_URL}/reset-password`, `{APP_URL}/invite/**` |
| JWT expiry | 3600 |
| SMTP | Your transactional sender (Resend SMTP or Supabase's) |
| Invite / confirm templates | Point links at `{APP_URL}/invite/[token]` and `{APP_URL}/reset-password` |

Disable: phone auth, social providers, anonymous sign-in, public sign-ups.

Invitation acceptance creates `auth.users`. Trigger `handle_new_auth_user` then creates `public.profiles` only when a valid invitation exists. A signup without an invitation fails at the database.

Login is rate-limited to 5 failed attempts per email in 15 minutes (`login_attempts` table, service-role only). The sixth attempt returns a lockout message. Failures write `LOGIN_FAILED` / `LOGIN_LOCKED` audit rows.

## 5. Storage bucket

Create a **private** bucket named `kito-files` (or the value of `SUPABASE_STORAGE_BUCKET`).

- Public access: off
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/csv`
- CORS: origin = `NEXT_PUBLIC_APP_URL`, methods `GET, PUT, POST`, headers `Authorization, Content-Type`

Objects are served only via short-lived signed URLs. Never make the bucket public.

Suggested key layout:

```
profiles/{profile_id}/{filename}
statements/{profile_id}/{reference}.pdf
statements/{profile_id}/{reference}.csv
```

## 6. M-Pesa Daraja

Leave `MPESA_ENABLED=false` until sandbox credentials work. When false, the pay button is disabled and reads "M-Pesa is not configured yet. Ask your treasurer to record the payment."

Sandbox checklist:

1. Register an app on the Safaricom Daraja portal.
2. Enable STK Push and C2B.
3. Set `MPESA_CALLBACK_URL` to `https://<prod-or-tunnel>/api/webhooks/mpesa/stk`.
4. Register C2B confirmation URL `https://<host>/api/webhooks/mpesa/c2b`.
5. Test a sandbox STK Push from `/reports` on an outstanding contribution.

Production credentials replace sandbox values and set `MPESA_ENV=production`.

## 7. Vercel

1. Import the `kito-mastermind` directory as the project root.
2. Framework preset: Next.js. Install command: `pnpm install`. Build: `pnpm build`.
3. Copy every variable from `.env.example` into Vercel Environment Variables (Production + Preview).
4. `vercel.json` already declares the cron schedule. Vercel Cron requires a paid plan for production schedules.

Cron paths (UTC):

| Path | Schedule | Nairobi meaning |
|---|---|---|
| `/api/cron/overdue-actions` | `5 21 * * *` | shortly after midnight |
| `/api/cron/expire-requests` | `10 21 * * *` | |
| `/api/cron/recalculate-points` | `20 21 * * *` | |
| `/api/cron/match-rescan` | `30 21 * * *` | |
| `/api/cron/dues-generation` | `0 5 1 * *` | 1st of month, 08:00 |
| `/api/cron/stk-poll` | `*/5 * * * *` | every 5 minutes |
| `/api/cron/daily-digest` | `0 4 * * *` | 07:00 |
| `/api/cron/pii-retention` | `0 2 * * 0` | Sunday 05:00 |

Each handler requires `Authorization: Bearer ${CRON_SECRET}`.

## 8. Sentry

1. Create a Next.js project.
2. Set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN`.
3. Confirm the deny-list includes `client_name`, `client_phone`, `client_email`, `notes`, `phone`, `email`, `password`, `access_token_enc`, and every M-Pesa raw payload field **before** the first production deploy. `src/lib/sentry-scrub.ts` is the source of truth; `pnpm test` includes a deliberate-error case.
4. Rate limits (access requests, nudges, match messages, statements) live in `rate_limits` and are enforced by the service role.
5. `ENCRYPTION_KEY` is required for CRM token encrypt/decrypt even though CRM connect is disabled in v1.

## 9. Legal / ODPC (human only)

- Register with the ODPC before production launch.
- Have a Kenyan advocate review controller vs processor position.
- Privacy policy must note cross-border transfer if Supabase is hosted outside Kenya.

## 10. Launch checklist

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green
- [ ] Leak test `tests/e2e/leak.spec.ts` green
Playwright E2E uses port `3001` (`pnpm exec next dev --port 3001`) so it does not collide with another app on 3000. Set `E2E_PORT` to override.
- [ ] Chapter pool load test under 200ms at 500 leads
- [ ] Auth settings from section 4 applied
- [ ] Storage bucket private, CORS set
- [ ] All env vars set in Vercel
- [ ] `MPESA_ENABLED=false` until sandbox STK succeeds
- [ ] Sentry PII scrubbing verified with a deliberate error
- [ ] Backup restore tested (Supabase daily backups, 30-day retention)
- [ ] Domain pointed; Site URL and redirect list updated

## 11. Backup restore runbook

1. Supabase dashboard → Database → Backups → download or PITR to a new project.
2. `pnpm exec supabase db dump` is not a substitute for a tested restore.
3. After restore: verify `leads` RLS still denies contact columns to non-owners, then run `pnpm test` against the restored project only if it is not production.
4. Record the date of the last successful restore test here:

| Date | Operator | Result |
|---|---|---|
| | | not yet tested |
