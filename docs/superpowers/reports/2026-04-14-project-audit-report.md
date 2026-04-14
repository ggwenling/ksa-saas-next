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

### Task create/update schemas allow empty `assigneeId`, causing API handlers to accept invalid payloads and potentially throw 500s

- Severity: `P1`
- Module: `domain` + `api/tasks`
- Location: `src/lib/domain/task.ts`, `src/app/api/teams/[teamId]/tasks/route.ts`, `src/app/api/teams/[teamId]/tasks/[taskId]/route.ts`
- Observed issue: `assigneeId` is defined as `z.string().trim().optional().nullable()` (no `min(1)` or ID format check), so `assigneeId: ""` is a valid payload. Both create and update handlers gate membership validation with `if (parsed.data.assigneeId)`, so the empty-string case bypasses membership checks and can be written through to Prisma as an invalid foreign key value.
- Evidence: In `src/lib/domain/task.ts`, `createTaskSchema.assigneeId` (line 20) and `updateTaskSchema.assigneeId` (line 34) accept an empty string. In `src/app/api/teams/[teamId]/tasks/route.ts`, the membership check is truthiness-based (line 73) but the create write uses `assigneeId: parsed.data.assigneeId ?? null` (line 98). In `src/app/api/teams/[teamId]/tasks/[taskId]/route.ts`, the membership check is also truthiness-based (line 37) while the update writes `assigneeId: parsed.data.assigneeId` (line 70).
- Why it matters: Empty strings are a common "unset" value from HTML forms and UI state. This can turn a user input/validation problem into an intermittent 500 error (or silent data corruption if referential integrity is not enforced in some environments).
- Likely impact: Task create/update can fail unexpectedly with server errors, or tasks can end up with invalid assignee references that break downstream queries and UI assumptions.
- Recommended repair direction: Normalize empty strings to `null` before schema validation, add `min(1)` (or a real ID validator like `cuid`/`uuid` depending on the schema), and add tests covering `assigneeId: ""` plus membership mismatch.

### Dashboard server composition duplicates API route query and shaping logic, increasing contract drift risk

- Severity: `P3`
- Module: `server/dashboard-data` + `api`
- Location: `src/lib/server/dashboard-data.ts`, `src/lib/dashboard/presenters.ts`, `src/app/api/teams/route.ts`, `src/app/api/teams/[teamId]/files/route.ts`
- Observed issue: The same "what to query" and "how to shape it" logic exists in two places: server-only dashboard data composition uses presenters, while API routes frequently re-implement mapping logic inline. This is already visible for team summary shaping (progress, member count, invite code hiding) and team file shaping (`canDelete`).
- Evidence: `src/lib/server/dashboard-data.ts` returns teams via `presentTeamSummaries(...)` (lines 86-134) while `src/app/api/teams/route.ts` repeats the Prisma includes and maps to `{ progress, memberCount, inviteCode }` manually (lines 22-75). Similarly, `src/lib/server/dashboard-data.ts` returns files via `presentTeamFiles(...)` (lines 196-215) while `src/app/api/teams/[teamId]/files/route.ts` maps rows inline and computes `canDelete` directly (lines 27-52).
- Why it matters: This is a classic source of "data contract drift", where one surface (server dashboard pages) changes while the other (API) lags behind, producing hard-to-debug UI inconsistencies and brittle client assumptions.
- Likely impact: Future changes to permissions, derived fields, or serialization can ship partially, breaking some pages or API consumers while others look correct.
- Recommended repair direction: Factor shared "query + present" functions (or at least shared presenter/serializer helpers) that are reused by both `dashboard-data` and API routes; add a small contract test suite that asserts stable fields for teams/files across both surfaces.

### Team file upload/delete lacks transactional behavior across DB and filesystem, leading to orphaned files or dangling DB state on partial failures

- Severity: `P2`
- Module: `files` + `storage`
- Location: `src/app/api/teams/[teamId]/files/route.ts`, `src/app/api/teams/[teamId]/files/[fileId]/route.ts`, `src/lib/storage/team-files.ts`
- Observed issue: File writes and DB mutations are performed in separate steps without compensating cleanup. Upload writes the file first and then inserts the DB row; delete removes the DB row first and then unlinks the file.
- Evidence: In `src/app/api/teams/[teamId]/files/route.ts`, the upload flow is `saveTeamFile(...)` (line 95) followed by `prisma.teamFile.create(...)` (line 97). In `src/app/api/teams/[teamId]/files/[fileId]/route.ts`, the delete flow is `prisma.teamFile.delete(...)` (line 52) followed by `removeTeamFile(...)` (line 53). Storage helpers in `src/lib/storage/team-files.ts` use `writeFile` (line 30) and `unlink` (line 45) with only `ENOENT` suppressed.
- Why it matters: Partial failures are common in real deployments (transient DB errors, disk full, permission changes, antivirus locks). Without compensation, you accumulate orphaned files, or you end up with successful user-facing deletes that leave data behind, complicating moderation and storage management.
- Likely impact: Disk usage grows over time; users may see inconsistent file state; operators must do manual cleanup.
- Recommended repair direction: Add compensating cleanup (delete the file if DB insert fails), and make delete best-effort but observably safe (structured logs/metrics for unlink errors, optionally unlink-before-delete if you can tolerate "file missing" while DB row exists). Consider adding a periodic reconcile/cleanup job.

### Team file path resolution does not guard against `..` segments, so a corrupted `relativePath` could escape the intended storage root

- Severity: `P3`
- Module: `storage` + `api/files`
- Location: `src/lib/storage/team-files.ts`, `src/app/api/teams/[teamId]/files/[fileId]/download/route.ts`
- Observed issue: `getTeamFileAbsolutePath(relativePath)` normalizes path separators but does not reject `..` segments or enforce that the final resolved path stays within `STORAGE_ROOT`. The download route trusts `row.relativePath` from the DB and passes it directly into `getTeamFileAbsolutePath`.
- Evidence: `getTeamFileAbsolutePath()` uses `path.join(STORAGE_ROOT, normalized)` without validating traversal segments (`src/lib/storage/team-files.ts` lines 37-39). Download resolves `absPath = getTeamFileAbsolutePath(row.relativePath)` and then reads it (`src/app/api/teams/[teamId]/files/[fileId]/download/route.ts` lines 39-43).
- Why it matters: While the app writes `relativePath` itself today, any DB corruption/migration mistake (or future bug that allows writing arbitrary `relativePath`) could turn file download/delete into unintended local file access.
- Likely impact: Potential information disclosure of local server files if `relativePath` becomes attacker-controlled; harder to reason about filesystem safety invariants over time.
- Recommended repair direction: Enforce that `relativePath` is a safe, normalized, storage-internal path (reject `..`, absolute paths, and drive letters) and verify `path.resolve(absPath)` remains under `STORAGE_ROOT` before reading/unlinking.

### Task detail templating uses broad keyword matching and lacks coverage for ambiguous titles, which can produce incorrect guidance content

- Severity: `P3`
- Module: `domain/tasks`
- Location: `src/lib/domain/task-detail.ts`
- Observed issue: `resolveTemplate()` uses broad "contains any character in this set" regexes and fixed ordering to choose a template. Titles containing overlapping keywords can be routed to the first match, even when a later template is more relevant (for example a title containing both "市场" and "PPT/路演").
- Evidence: `resolveTemplate()` checks `/[市调竞品市场]/` first (line 48), then `/[路演答辩演讲PPT讲稿]/` (line 73), then `/[分工角色团队]/` (line 98); there are no tests asserting behavior when titles contain multiple keyword groups.
- Why it matters: This logic is user-facing (it shapes objective/criteria/next-actions). Wrong template selection can mislead teams and adds "why did it generate this" support burden.
- Likely impact: Confusing or irrelevant default content in task detail views, especially as titles become more descriptive and include multiple concepts.
- Recommended repair direction: Replace regex character-classes with explicit keyword arrays and deterministic selection (priority or scoring), and add a couple of tests for overlapping-keyword titles.

### Automated test coverage is limited to 4 Vitest unit suites for pure helpers and presenters; no route/DB/UI workflow coverage observed

- Severity: `P2`
- Module: `tests/coverage`
- Location: `src/lib/**/__tests__/*.test.ts`, `src/app/api/**`, `package.json`
- Observed issue: The current automated test surface focuses on pure functions (auth validation + password helpers, domain rules/formatting, and dashboard presenters). There are no tests that execute `src/app/api/**` route handlers, Prisma-backed flows, or dashboard page/component UX.
- Evidence: `rg --files src | rg __tests__` returns only 4 test files (`src/lib/auth/__tests__/validation.test.ts`, `src/lib/domain/__tests__/rules.test.ts`, `src/lib/domain/__tests__/task-detail.test.ts`, `src/lib/dashboard/__tests__/presenters.test.ts`). `npm run test` runs `vitest run` and reports `Test Files 4 passed (4)` / `Tests 23 passed (23)`.
- Why it matters: Most audited subsystems are implemented in API routes + Prisma queries (auth/session, role gating, CRUD for tasks/files/announcements/scores). Without integration tests, regressions in those areas will not be caught by the current test suite.
- Likely impact: Higher defect escape rate; runtime-only failures in common workflows (login/logout/session persistence, task mutations, file upload/delete, scoring and announcements).
- Recommended repair direction: Add a small number of API-route integration tests using a dedicated SQLite test database (or Prisma-backed fixtures) covering auth/session lifecycle, role-based access control, and at least one happy-path + one error-path per CRUD subsystem. Consider a minimal E2E smoke test for dashboard navigation and the top-level flows.

### Verification scripts do not provide a single “CI gate” for lint + unit tests + build prerequisites, allowing deploy-time failures to slip past tests

- Severity: `P2`
- Module: `verification`
- Location: `package.json` scripts, `npm run test`, `npm run build`
- Observed issue: The repo defines `lint`, `test`, and `build`, but there is no consolidated verification script (for example `verify`/`ci`) and no scripted baseline for build prerequisites (environment variables / DB connectivity). As a result, unit tests can pass while production build remains broken.
- Evidence: `package.json` defines `test: vitest run` and has no `typecheck`/`verify` script. In this audit, `npm run test` passed while `npm run build` failed due to missing `DATABASE_URL` (see `## Build And Runtime Risks`).
- Why it matters: Teams often rely on `npm test` (or a CI “tests only” job) as a quality gate. If build prerequisites are not validated in automation, deployment-breaking issues are discovered late.
- Likely impact: Broken production builds / blocked deployments despite “green tests”; higher cycle time when build failures are discovered after code review or at release time.
- Recommended repair direction: Add a `typecheck` (noEmit) script and a `verify`/`ci` script that runs `lint` + `test` + `build` under a documented `.env.example`/`.env.test` baseline (or a mocked/stubbed build mode for DB-backed routes).

### Domain unit coverage does not exercise task/team input validation boundaries, leaving common API edge cases untested

- Severity: `P3`
- Module: `domain/tests`
- Location: `src/lib/domain/__tests__/rules.test.ts`, `src/lib/domain/__tests__/task-detail.test.ts`
- Observed issue: Current domain tests cover `announcementSchema`, `scoreSchema`, `calculateTeamProgress`, `canDeleteTeamFile`, and a few `buildTaskDetail()` behaviors, but do not cover `createTeamSchema`, `createTaskSchema`, or `updateTaskSchema` boundary cases (including `assigneeId: ""`, `dueDate` format permutations, and nullable-vs-omitted field semantics).
- Evidence: `src/lib/domain/__tests__/rules.test.ts` imports `announcementSchema`, `scoreSchema`, `calculateTeamProgress`, and `canDeleteTeamFile` only, with no task/team schema assertions.
- Why it matters: The API layer trusts these schemas for validation. If schemas drift or allow unintended values, regressions will surface as production-only 400/500s rather than fast unit feedback.
- Likely impact: Increased probability of user-visible failures in task/team flows and more brittle frontend-backend integration.
- Recommended repair direction: Add a small set of schema-focused tests for `task.ts` and `team.ts`, especially around empty strings, nulls, and due date parsing expectations.

### API route review coverage notes (Task 4 addendum)

- Reviewed `src/app/api/auth/me/route.ts` (GET): simple session-backed identity endpoint returning `401` when `getCurrentUser()` is null and `200` with `{ data: user }` otherwise; no additional issues beyond the existing `getCurrentUser()` / `user.isActive` finding already recorded.
- Reviewed `src/app/api/announcements/route.ts` (GET/POST): requires auth, uses `canPublishAnnouncement()` for role gating, validates with `announcementSchema`, and returns `201` on create; no additional material issues found.
- Reviewed `src/app/api/scores/route.ts` (GET/POST): TEACHER-only via `requireRole(...)`, validates payload with `scoreSchema`, and uses `upsert`; no additional material issues found.
- Reviewed `src/app/api/teams/[teamId]/members/route.ts` (GET): requires auth + `requireTeamAccess(..., { allowTeacher: true })` and returns selected user fields; no additional material issues found.
- Reviewed `src/app/api/teams/[teamId]/files/[fileId]/download/route.ts` (GET): requires auth + `requireTeamAccess(..., { allowTeacher: true })`, reads from filesystem, and sets `Content-Disposition` for attachment; see the `relativePath` hardening finding above.

### Dashboard shell navigation selection and layout constraints create cross-page UX inconsistencies (nav highlight, mobile clipping risk)

- Severity: `P2`
- Module: `dashboard-shell`
- Location: `src/components/layout/dashboard-shell.tsx`
- Observed issue: Menu selection forces `/files` highlight for any route containing `/files` (including team-level `/teams/:teamId/files`), the sider content uses a fixed `h-[800px] min-h-[800px]` container without an explicit scroll strategy, the extra "Navigation" info panel renders a visible header but an empty body, and logout shows a success toast + redirect without checking request success.
- Evidence: Selection logic `if (pathname.includes("/files")) return ["/files"];`; fixed-height sider container `className="... h-[800px] min-h-[800px] ..."`; empty panel body in the "Navigation" card (a `<Typography.Text ...>` with no children); logout click handler `await fetch(...); message.success("已退出登录"); router.push("/login");` (no `res.ok` handling).
- Why it matters: These issues affect every dashboard page (global shell), and they compound on mobile or in deep team routes where users rely on stable navigation cues.
- Likely impact: Users see inconsistent active navigation state (especially on team files pages), may lose access to part of the nav on smaller screens, and may receive incorrect success feedback on logout failures.
- Recommended repair direction: Align selection logic to the dashboard IA (do not special-case on substring), remove fixed-height constraints or add intentional scroll behavior, remove/fill the empty info panel, and handle logout failure paths (check `res.ok`, show error state, and avoid redirect on failure).

### Dashboard pages rely on toast-only error feedback and have inconsistent/fragile async interaction states (missing catch, no retry, no mutation feedback)

- Severity: `P2`
- Module: `dashboard-pages`
- Location: `src/app/(dashboard)/files/page.tsx`, `src/app/(dashboard)/teams/[teamId]/board/page.tsx`, `src/app/(dashboard)/teams/[teamId]/files/page.tsx`
- Observed issue: Several pages rely on toast-only error feedback and/or silently return on failed requests, while some mutation flows lack `try/catch` and per-action progress/disabled states; task status changes on the board refresh data without success confirmation, which can feel like the action was ignored on slow connections.
- Evidence: `FilesEntryPage` (`/files`) `fetchTeams()` uses `try/finally` but no `catch` and returns early on `!res.ok` without an error message; team board `updateStatus()` refreshes data without any success confirmation; `deleteTask()` does show a success toast but still lacks `try/catch` and a per-action pending/disabled state; team files `deleteFile()` performs a fetch without `try/catch` and has no per-row progress/disabled state during delete.
- Why it matters: When fetches fail, users need deterministic, visible states (inline error + retry), not "empty list" ambiguity. For mutations, action feedback and disabled states prevent duplicate operations and confusion.
- Likely impact: Users misinterpret errors as "no data", retry by clicking repeatedly, and have lower trust in state changes (especially on the task board).
- Recommended repair direction: Standardize on per-page `loading / empty / error` views (not toast-only), add retry affordances, and wrap all async mutations in `try/catch` with disabled/progress UI and explicit success messaging where appropriate.

### Profile page displays hardcoded identity data (not derived from the logged-in session)

- Severity: `P1`
- Module: `profile`
- Location: `src/app/(dashboard)/profile/page.tsx`
- Observed issue: The profile UI renders fixed identity values (e.g. display name, username, role, join date) rather than loading the current user from session-backed data.
- Evidence: The page body contains literal values such as `张三`, `leader01`, `队长`, and `2026-04-10`.
- Why it matters: This page is explicitly about account identity. Showing incorrect identity data is a high-trust UX failure and can mislead users about permissions and which account is active.
- Likely impact: Every user sees the same profile content, causing confusion and increasing support burden ("wrong account" / "wrong role").
- Recommended repair direction: Fetch identity from a session-backed endpoint (e.g. `/api/auth/me`) or render as a server component using the same auth utilities used elsewhere; ensure role/team labels come from real associations.

### Shared shell/providers/global styling review notes (Task 5 addendum)

- Reviewed `src/app/layout.tsx`, `src/components/providers/app-provider.tsx`, and `src/app/globals.css`: the shared App provider wires Ant Design `ConfigProvider` with a consistent token palette and zh-CN locale, and global styling establishes the repo-wide "glass" look; no additional material UX/interaction issues found beyond the dashboard-shell/page findings already recorded.
- Note: These files contain Chinese UI strings and font names. They render correctly when interpreted as UTF-8, but can appear mojibake-garbled during review if tools default to a non-UTF-8 decoder (see encoding confirmation below).

### Encoding and string-garbling confirmation (dashboard scope)

- Severity: `P3`
- Module: `dashboard/strings`
- Location: `src/components/layout/dashboard-shell.tsx`, `src/app/(dashboard)/**`, `src/app/layout.tsx`, `src/app/globals.css`
- Observed issue: No high-priority string garbling was found in the dashboard shell/pages when files are interpreted as UTF-8; mojibake-style output during audit can be reproduced by reading UTF-8 source files with a non-UTF-8 default decoder (for example PowerShell `Get-Content` without `-Encoding utf8`).
- Evidence: Searching for common garbling indicators (replacement character `�`, smart-quote artifacts, or mojibake sequences) in the dashboard shell/pages produced no matches; additionally, `src/app/layout.tsx` metadata strings and `src/app/globals.css` font `local(...)` names render correctly when interpreted as UTF-8 but appear garbled when reviewed with a non-UTF-8 decoder.
- Why it matters: Garbled UI strings are a high-severity UX issue when present, and encoding mismatches can also mislead code review and audits if the toolchain is not consistently UTF-8.
- Likely impact: Not expected to impact end users given typical Next/browser UTF-8 handling, but runtime was not explicitly verified in this task; the risk is primarily developer-facing (review/edit mistakes if files are opened/saved with the wrong encoding).
- Recommended repair direction: Ensure editors and review tooling treat the repo as UTF-8 (and avoid tools/settings that default to legacy code pages).

## Bug Risks

- Task create/update flows can accept `assigneeId: ""` (common from HTML forms), bypass membership validation, and fail later as a Prisma foreign key error, turning a 400 into an intermittent 500.
- If `TeamFile.relativePath` becomes corrupted or attacker-controlled, the download/delete flows can access files outside the intended storage directory because path traversal segments are not explicitly rejected.

## Test Gaps

- No automated tests for `src/app/api/**` route handlers (auth/session, teams/tasks/files/announcements/scores) executing against Prisma/SQLite.
- No tests validating session lifecycle behavior (cookie issuance/clearing, session persistence/expiry, role gating via `requireRole`/`requireTeamAccess`).
- No tests exercising dashboard pages/components; current coverage stops at presenters and pure helper functions.
- No automated “build gate” coverage validating production build prerequisites (for example a `verify` job/script that runs `next build` with required env like `DATABASE_URL`).

## UX Issues

- Dashboard nav highlight can be misleading on team file routes (`/teams/:teamId/files`), because the shell forces `/files` as the selected menu item for any pathname containing `/files`.
- Dashboard sider content is fixed-height (`800px`) without a clear scroll strategy, increasing the chance of clipped navigation on shorter viewports.
- The dashboard shell renders a "Navigation" info card with an empty body, which reads as an unfinished/broken UI element.
- Logout shows a success toast and redirects without checking logout API success, so failures can be masked as successful sign-outs.
- `/files` team-selection page silently treats API failures as "no accessible teams" (no `catch`, no error UI, no retry).
- Team board and team file mutations have inconsistent interaction feedback (no progress/disabled states for PATCH/DELETE; status changes refresh silently).
- Profile page currently shows hardcoded user identity values instead of the logged-in session's real account data.

## Structural Issues

- Server-only dashboard composition and API routes duplicate Prisma queries and derived-field shaping (teams/files/scores), increasing long-term "data contract drift" and maintenance overhead.

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
