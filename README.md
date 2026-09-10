# KITO Mastermind

Invitation-only platform for Kenyan real estate mastermind chapters. Next.js 15 and Supabase.

A client's name, phone, email and notes belong to the agent who logged the lead. There is no admin override.

Repository: [github.com/kitomastermind/Kito-Mastermind](https://github.com/kitomastermind/Kito-Mastermind)

```bash
git clone https://github.com/kitomastermind/Kito-Mastermind.git
cd Kito-Mastermind
```

This directory is the project root (Render, Vercel, `pnpm`, and Supabase CLI all run from here). On Render use a Node service, build `corepack enable && pnpm install && pnpm build`, start `pnpm start`.

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

Production gate from `SETUP.md`:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Setup

Follow `SETUP.md`. Copy `.env.example` to `.env.local` and fill every variable.

## Docs in this repo

- `SETUP.md` — human handoff (Supabase, Auth, storage, M-Pesa, Vercel)
- `DECISIONS.md` — choices made under the open-decision rules

## Project structure

```
src/app/            Routes, layouts, API, marketing + portal pages
src/components/     Brand, portal shell, marketing, shared UI
src/server/         Actions, policy, repositories, Supabase
src/lib/            Brand, types, security headers
supabase/           Migrations and seed
tests/              Unit, policy, integration, e2e
```
