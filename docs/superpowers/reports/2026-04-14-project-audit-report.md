# 2026-04-14 Project Audit Report

## Health Overview

- Repository snapshot: Next.js app with auth, dashboard, teams, tasks, files, announcements, scores, and profile flows.
- Current scripts checked: `dev`, `build`, `start`, `lint`, `test`, `db:seed`.
- Data layer checked: Prisma + SQLite with session, team, task, score, announcement, and file models.
- Audit mode: read-only code review plus verification commands, report only.

Baseline inventory capture confirmed that `AGENTS.md` notes this Next.js variant's breaking differences, `package.json` is pinned to Next 16.2.3/React 19/Prisma 7 with Ant Design, Tailwind 4, and the reporting scripts, and the audit spec scope covers auth, dashboard, teams, tasks, files, announcements, scores, profile, Prisma wiring, APIs, and verification-driven output.

`prisma/schema.prisma` targets SQLite and defines `User`, `Team`, `TeamMember`, `InviteCode`, `Task`, `Score`, `Session`, `Announcement`, `TeamFile`, and `UserRole`/`TaskStatus` enums; many relations cascade (e.g., Team memberships, tasks, files, and announcements) while leader/teacher/creator/inviteCode links use `onDelete: Restrict` and the Task assignee uses `SetNull`.

`rg --files src prisma docs/superpowers` confirms the source layout: lib auth/dashboard/domain utilities, API route hierarchy (`app/api/...`), components, providers, CSS, Prisma migrations, and audit docs/scripts.

At baseline capture time, `git log --oneline -5` listed `b6e54d8 docs: describe git log baseline`, `ea19055 docs: update git log summary`, `4080f08 docs: fix audit report inventory`, `f2d876c docs: add baseline inventory summary`, and `f3aa064 docs: scaffold project audit report`.

## Findings

### Auth UI forms contain unterminated string literals and broken JSX attributes

- Severity: `P0`
- Module: `auth`
- Location: `src/components/auth/login-form.tsx`
- Observed issue: The login form contains unterminated string literals inside JSX props (for example `placeholder="...` never closes) and other malformed string literals in validation messages, which will fail TypeScript/JSX parsing.
- Evidence: In `Input.Password`, `placeholder="...` is unterminated and the next prop begins on the following line (e.g. `placeholder="...` then `className="...`).
- Why it matters: This is a hard build/runtime blocker; the Next.js compiler cannot parse the module, preventing the auth UI (and potentially the whole build) from compiling.
- Likely impact: Login page fails to compile or render; CI/production builds can fail depending on compilation traversal.
- Recommended repair direction: Replace any non-ASCII "smart quotes"/garbled characters with ASCII delimiters, ensure all JSX props are well-formed, and normalize file encoding to UTF-8 across the repo.

### Registration UI form contains unterminated localized strings and malformed JSX

- Severity: `P0`
- Module: `auth`
- Location: `src/components/auth/register-form.tsx`
- Observed issue: Multiple strings appear to terminate with non-ASCII/garbled characters instead of `"`/`` ` `` (for example in `useMemo` tips, form rule messages, placeholders, and the bottom CTA `Link`), leaving unterminated literals and invalid JSX.
- Evidence: The `tip` strings show `return "..."` without a closing `"`, and the password input shows `placeholder="...` without a closing `"`.
- Why it matters: The registration UI cannot be parsed/compiled, blocking the core onboarding flow and potentially failing builds.
- Likely impact: Register page fails to compile or shows broken UI; users cannot create accounts.
- Recommended repair direction: Normalize quotation marks and punctuation to ASCII, retype the affected localized strings, and enforce editor/formatter settings that prevent smart-quote insertion.

### Auth registration API handler contains unterminated string and template literals (likely quote corruption or editing artifact)

- Severity: `P0`
- Module: `auth`
- Location: `src/app/api/auth/register/route.ts`
- Observed issue: Several response messages and a template literal assignment (team name) are unterminated, making the route handler syntactically invalid.
- Evidence: Patterns include `message: "...,` (missing closing `"`) and `name: \`${displayName}...,` (missing closing `\`` / `}`).
- Why it matters: The `/api/auth/register` endpoint cannot compile, so registration is unavailable and builds may fail when Next attempts to compile or collect route data.
- Likely impact: Registration API requests fail; `next build`/deploy can fail due to parse errors in route code.
- Recommended repair direction: Fix all unterminated literals, re-encode file as UTF-8, and add a fast "parse-only" check (TypeScript or ESLint) in CI to catch syntax/encoding regressions early.

### Auth logout API handler contains unterminated string literals

- Severity: `P0`
- Module: `auth`
- Location: `src/app/api/auth/logout/route.ts`
- Observed issue: JSON response messages are missing closing quotes, leaving invalid TypeScript syntax.
- Evidence: The handler returns `NextResponse.json({ message: "..." });` with a missing closing `"`.
- Why it matters: Logout is part of the session lifecycle; if the handler cannot compile, sessions/cookies cannot be reliably cleared and builds can fail.
- Likely impact: `/api/auth/logout` fails to deploy/execute; users may be unable to log out cleanly.
- Recommended repair direction: Replace broken localized strings with valid quoted literals and normalize file encoding; add minimal endpoint smoke tests that compile and hit the route.

### Team access guard contains an unterminated localized string literal

- Severity: `P0`
- Module: `auth`
- Location: `src/lib/auth/team-access.ts`
- Observed issue: The 403 response message string is unterminated, making this helper syntactically invalid.
- Evidence: The response is constructed as `NextResponse.json({ message: "..." }, { status: 403 })` with a missing closing `"`.
- Why it matters: This helper is a shared permission primitive; syntax errors here can cascade into failures anywhere team access checks are imported.
- Likely impact: Team-protected pages/APIs fail to compile or crash; authorization checks may be unusable.
- Recommended repair direction: Fix the literal delimiter issue and standardize localization strings and file encoding (UTF-8) to prevent similar corruption.

### Login API leaks account existence and disabled status via distinct responses (username enumeration)

- Severity: `P2`
- Module: `auth`
- Location: `src/app/api/auth/login/route.ts`
- Observed issue: The handler returns `404` for a missing/disabled user and `401` for an incorrect password, allowing an attacker to distinguish valid usernames and disabled accounts.
- Why it matters: Account enumeration reduces attacker cost for brute force and targeted attacks, and can leak operational/admin actions (disabled vs not found).
- Likely impact: Increased credential-stuffing success rate and privacy leakage about which usernames exist.
- Recommended repair direction: Return a uniform status/message for all auth failures (typically `401` with a generic message) and consider rate limiting/backoff per IP/username.

### Disabled users may retain access via existing sessions (no active check in current-user resolution)

- Severity: `P1`
- Module: `auth`
- Location: `src/lib/auth/current-user.ts`
- Observed issue: `getCurrentUser()` resolves sessions by token + `expiresAt`, but does not validate `user.isActive`; a previously logged-in user who is later disabled could keep accessing protected resources until the session expires.
- Why it matters: "Disable account" is commonly expected to revoke access immediately; relying only on session expiry is a security and admin-control gap.
- Likely impact: Deactivated users can continue using the app for up to the session TTL (7 days) unless additional checks are applied elsewhere.
- Recommended repair direction: Include `isActive` in the user selection and enforce it in `getCurrentUser()` (or invalidate sessions on disable), and add a test that disabled users receive `401/403` even with a valid session.

### Registration flow is not transactional and invite-code usage is race-prone

- Severity: `P2`
- Module: `auth`
- Location: `src/app/api/auth/register/route.ts`
- Observed issue: Leader registration performs multiple creates (user, team, invite code) without a transaction; member registration checks invite code limits and then increments `usedCount` in a separate write, allowing race conditions to oversubscribe `maxUses`.
- Why it matters: Partial writes create orphaned records and inconsistent state; race conditions can violate business rules (invite code max uses) under concurrency.
- Likely impact: Users may be created without teams, invite codes may exceed allowed usage, and support/admin cleanup burden increases.
- Recommended repair direction: Wrap registration flows in a Prisma transaction and enforce invite-code consumption with a single conditional update (or database constraint) to make checks and increments atomic.

### Prisma bootstrap throws at import time when DATABASE_URL is missing, blocking builds and some tooling

- Severity: `P0`
- Module: `db`
- Location: `src/lib/db/prisma.ts`
- Observed issue: Prisma throws `DATABASE_URL is required` at module import time when `process.env.DATABASE_URL` is missing. Task 2 verification confirms `npm run build` currently fails with this exact error during Next page-data collection.
- Evidence: `if (!databaseUrl) { throw new Error("DATABASE_URL is required"); }` executes at module load.
- Why it matters: This is a production build blocker today, and import-time throws also break any context that compiles/executes modules transitively unless the environment is perfectly configured.
- Likely impact: CI/build pipelines fail; developers cannot run production builds locally without manual env setup; deploys can break if env is misconfigured.
- Recommended repair direction: Provide a documented env bootstrap (`.env.example` + CI config) and consider deferring Prisma initialization behind a function boundary for contexts that should not require DB at build time.

### Session tokens are stored in plaintext in the database

- Severity: `P2`
- Module: `auth`
- Location: `src/lib/auth/session.ts`
- Observed issue: `createSession()` generates a bearer token and stores it directly in `Session.token`. If the session table leaks, attackers can reuse tokens without additional secrets.
- Why it matters: Session tokens are equivalent to passwords for active sessions; plaintext storage increases blast radius in a DB exfiltration event.
- Likely impact: Account takeover for any active session whose token is exposed.
- Recommended repair direction: Store only a hash of the token server-side (compare hashed token on lookup), and rotate/invalidate sessions on sensitive events (password change, role change, disable).

### Session lifecycle lacks cleanup and rotation primitives

- Severity: `P3`
- Module: `auth`
- Location: `src/lib/auth/session.ts`
- Observed issue: Sessions expire via `expiresAt` checks, but there is no cleanup path for expired sessions and no "sliding" renewal/rotation strategy.
- Why it matters: Over time, expired sessions can accumulate and increase DB size and query cost; lack of rotation can make long-lived cookies a higher-value target.
- Likely impact: Slow growth in storage and operational overhead; reduced ability to tune session security posture.
- Recommended repair direction: Add a periodic cleanup job (or on-read cleanup) for expired sessions and decide whether to implement sliding expiry or explicit session rotation on login.

### Password hashing uses bcryptjs with a fixed cost factor and no upgrade strategy

- Severity: `P3`
- Module: `auth`
- Location: `src/lib/auth/password.ts`
- Observed issue: Password hashing uses `bcryptjs` with `SALT_ROUNDS = 10` hard-coded; there is no mechanism to tune cost per environment, nor any rehash-on-login path to upgrade hashes over time.
- Why it matters: Password hashing strength is a moving target as hardware improves; a fixed cost can become too weak, and lack of a rehash path makes upgrades harder without forced resets.
- Likely impact: Security posture can silently degrade over time; operational complexity increases when changing hash parameters.
- Recommended repair direction: Make cost configurable (with safe defaults) and add a rehash strategy (detect outdated cost and rehash on successful login), or migrate to a modern KDF if desired.

### Session cookie flags are a decent baseline but could be hardened

- Severity: `P3`
- Module: `auth`
- Location: `src/lib/auth/session.ts`
- Observed issue: `setSessionCookie()` sets `httpOnly`, `sameSite: "lax"`, and `secure` in production, but does not use hardened cookie naming (for example `__Host-` prefix) and does not document CSRF assumptions for state-changing endpoints.
- Why it matters: Cookie hardening reduces session theft and cross-site request risks; unclear assumptions increase the chance of future regressions when routes or cookie attributes change.
- Likely impact: Slightly higher security risk surface and higher chance of accidental weakening over time.
- Recommended repair direction: Consider adopting `__Host-` cookie naming (with `path: "/"` and no `domain`), document the CSRF posture (given `sameSite: "lax"`), and add a small test/smoke check that asserts cookie flags.

### Auth/session behavior lacks direct tests for session lifecycle and authorization invariants

- Severity: `P3`
- Module: `auth`
- Location: `src/lib/auth/__tests__/validation.test.ts`
- Observed issue: Current tests cover only Zod schema validation and the password helper; there are no tests asserting session expiry handling, logout invalidation, cookie flags, or that disabled users are rejected even with an existing session.
- Why it matters: Auth/session logic is security-critical and easy to regress with small changes, especially around cookies and session invalidation.
- Likely impact: Regressions can ship unnoticed (for example weaker cookie flags, broken logout, disabled users still authorized).
- Recommended repair direction: Add minimal unit/integration tests around `createSession`/`setSessionCookie`/`getCurrentUser` and one API smoke test per auth route for expected status codes.

## Bug Risks

## Test Gaps

## UX Issues

## Structural Issues

## Build And Runtime Risks

### Verification Results

- `npm run lint`: pass; ESLint exited 0 again, confirming there were no lint policy violations.
  ```
  > kas-saas-next@0.1.0 lint
  > eslint
  ```
- `npm run test`: pass; `vitest run` completed with all suites passing, so there are no failing tests or harness issues.
  ```
  > kas-saas-next@0.1.0 test
  > vitest run

   Test Files  4 passed (4)
        Tests  23 passed (23)
  ```
- `npm run build`: fail; `next build` compiles and runs TypeScript but halts during page-data collection because `DATABASE_URL is required`, blocking the production build until the environment variable is supplied or the affected route is mocked.
  ```
  > kas-saas-next@0.1.0 build
  > next build

  Error: DATABASE_URL is required
  ...
  Error: Failed to collect page data for /api/auth/logout
  ```

## Suggested Repair Order
