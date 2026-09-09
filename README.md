# KITO Mastermind

Invitation-only platform for Kenyan real estate mastermind chapters. Next.js 15 and Supabase.

A client's name, phone, email and notes belong to the agent who logged the lead. There is no admin override.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (unit, policy, integration) |
| `pnpm test:e2e` | Playwright |
| `pnpm build` | Production build |
| `pnpm seed` | Load demo data (blocked against remote unless `ALLOW_REMOTE_SEED=true`) |
| `pnpm gen:types` | Generate `src/lib/types/database.ts` from local Supabase |

## Setup

Follow `SETUP.md`. Copy `.env.example` to `.env.local` and fill every variable.

## Docs in this repo

- `SETUP.md` — human handoff (Supabase, Auth, storage, M-Pesa, Vercel)
- `DECISIONS.md` — choices made under the open-decision rules
