# Decisions

Choices made under Section 0.4 of the Cursor execution plan. Open items from Section 22 use the documented default unless a later line records a change.

## Scaffold

- **Project root is `kito-mastermind/`.** `create-next-app` rejected the parent folder name `Kito` (npm package names cannot contain capital letters). The app lives in the nested directory specified in Section 4.
- **Local toolchain vs locked versions.** The build machine has Node 24 and pnpm 11. Production target remains Node 20 LTS and pnpm 9 as specified. No code depends on Node 24 APIs.
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
