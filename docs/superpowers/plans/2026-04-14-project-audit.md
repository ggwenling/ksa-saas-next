# Project Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a developer-facing audit report for the full `kas-saas-next` project that identifies bugs, stability risks, UX issues, test gaps, and structural weaknesses without shipping product code changes in this phase.

**Architecture:** The audit proceeds in a fixed sequence: baseline inventory, automated verification, static review by subsystem, UX review by page flow, then report consolidation. The only new artifact produced during execution is a dated Markdown audit report under `docs/superpowers/reports/`, so the work stays read-only aside from documentation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7, SQLite, Ant Design 6, Vitest 4, ESLint 9, PowerShell

---

## File Structure Map

**Create**

- `docs/superpowers/reports/2026-04-14-project-audit-report.md` - final developer-facing audit report

**Review**

- `AGENTS.md` - repo-specific operating constraints
- `package.json` - scripts and runtime/development dependencies
- `prisma/schema.prisma` - database shape and relational constraints
- `prisma/seed.mjs` - seed assumptions and sample data
- `src/lib/db/prisma.ts` - Prisma client initialization
- `src/lib/auth/password.ts` - password hashing and comparison
- `src/lib/auth/session.ts` - session creation and cookie behavior
- `src/lib/auth/current-user.ts` - auth gate and user lookup behavior
- `src/lib/auth/team-access.ts` - team authorization rules
- `src/lib/auth/validation.ts` - auth input validation
- `src/lib/auth/__tests__/validation.test.ts` - auth validation coverage
- `src/lib/domain/team.ts` - team creation schema/rules
- `src/lib/domain/task.ts` - task domain validation
- `src/lib/domain/task-detail.ts` - task detail shaping logic
- `src/lib/domain/progress.ts` - progress computation logic
- `src/lib/domain/announcement.ts` - announcement permission logic
- `src/lib/domain/file.ts` - file-domain constraints
- `src/lib/domain/score.ts` - score-domain rules
- `src/lib/domain/__tests__/rules.test.ts` - domain rule coverage
- `src/lib/domain/__tests__/task-detail.test.ts` - task detail coverage
- `src/lib/server/dashboard-data.ts` - server data composition for dashboard pages
- `src/lib/dashboard/presenters.ts` - presentation transforms
- `src/lib/dashboard/types.ts` - dashboard contracts
- `src/lib/dashboard/__tests__/presenters.test.ts` - presenter coverage
- `src/lib/storage/team-files.ts` - file storage behavior
- `src/components/layout/dashboard-shell.tsx` - global dashboard UX and navigation
- `src/components/providers/app-provider.tsx` - app-level provider wiring
- `src/components/auth/login-form.tsx` - login flow UX and validation feedback
- `src/components/auth/register-form.tsx` - register flow UX and validation feedback
- `src/components/ui/reveal.tsx` - shared animation behavior
- `src/lib/ui/motion.ts` - motion configuration
- `src/app/layout.tsx` - root layout behavior
- `src/app/page.tsx` - root redirect behavior
- `src/app/globals.css` - shared styles and possible UX/accessibility issues
- `src/app/(auth)/login/page.tsx` - login page
- `src/app/(auth)/register/page.tsx` - register page
- `src/app/(dashboard)/layout.tsx` - dashboard layout gate
- `src/app/(dashboard)/teams/page.tsx` - team list flow
- `src/app/(dashboard)/teams/[teamId]/board/page.tsx` - team board flow
- `src/app/(dashboard)/teams/[teamId]/files/page.tsx` - team file flow
- `src/app/(dashboard)/files/page.tsx` - files entry page
- `src/app/(dashboard)/announcements/page.tsx` - announcements page
- `src/app/(dashboard)/teacher/scores/page.tsx` - teacher scores page
- `src/app/(dashboard)/profile/page.tsx` - profile page
- `src/app/api/auth/login/route.ts` - login API
- `src/app/api/auth/register/route.ts` - register API
- `src/app/api/auth/logout/route.ts` - logout API
- `src/app/api/auth/me/route.ts` - session/user API
- `src/app/api/teams/route.ts` - team list/create API
- `src/app/api/teams/[teamId]/members/route.ts` - membership API
- `src/app/api/teams/[teamId]/tasks/route.ts` - task list/create API
- `src/app/api/teams/[teamId]/tasks/[taskId]/route.ts` - task update API
- `src/app/api/teams/[teamId]/files/route.ts` - file upload/list API
- `src/app/api/teams/[teamId]/files/[fileId]/route.ts` - file metadata/delete API
- `src/app/api/teams/[teamId]/files/[fileId]/download/route.ts` - file download API
- `src/app/api/announcements/route.ts` - announcement API
- `src/app/api/scores/route.ts` - score API

### Task 1: Create Audit Workspace And Baseline Inventory

**Files:**
- Create: `docs/superpowers/reports/2026-04-14-project-audit-report.md`
- Review: `AGENTS.md`
- Review: `package.json`
- Review: `docs/superpowers/specs/2026-04-14-project-audit-design.md`
- Review: `prisma/schema.prisma`

- [ ] **Step 1: Create the audit report skeleton**

```markdown
# 2026-04-14 Project Audit Report

## Health Overview

## Findings

## Bug Risks

## Test Gaps

## UX Issues

## Structural Issues

## Build And Runtime Risks

## Suggested Repair Order
```

- [ ] **Step 2: Save the skeleton to the report path**

Use this exact file path:

```text
docs/superpowers/reports/2026-04-14-project-audit-report.md
```

- [ ] **Step 3: Capture the baseline repo inventory**

Run:

```powershell
Get-Content AGENTS.md
Get-Content package.json
Get-Content docs/superpowers/specs/2026-04-14-project-audit-design.md
Get-Content prisma/schema.prisma
rg --files src prisma docs/superpowers
git log --oneline -5
```

Expected:

```text
You can identify the current scripts, major modules, Prisma models, spec scope, and the most recent commits before starting subsystem review.
```

- [ ] **Step 4: Record the baseline summary in `Health Overview`**

Append this structure to the `## Health Overview` section:

```markdown
- Repository snapshot: Next.js app with auth, dashboard, teams, tasks, files, announcements, scores, and profile flows.
- Current scripts checked: `dev`, `build`, `start`, `lint`, `test`, `db:seed`.
- Data layer checked: Prisma + SQLite with session, team, task, score, announcement, and file models.
- Audit mode: read-only code review plus verification commands, report only.
```

- [ ] **Step 5: Commit the initial audit scaffold**

```bash
git add docs/superpowers/reports/2026-04-14-project-audit-report.md
git commit -m "docs: scaffold project audit report"
```

### Task 2: Run Automated Verification And Record Failures

**Files:**
- Modify: `docs/superpowers/reports/2026-04-14-project-audit-report.md`
- Review: `package.json`
- Review: `eslint.config.mjs`
- Review: `tsconfig.json`

- [ ] **Step 1: Run lint**

Run:

```powershell
npm run lint
```

Expected:

```text
Either the command exits 0, or it reports concrete lint failures with file paths and rule names to record in the report.
```

- [ ] **Step 2: Run tests**

Run:

```powershell
npm run test
```

Expected:

```text
Either the command exits 0, or it reports failing suites/tests that reveal broken logic or missing environment assumptions.
```

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected:

```text
Either the build succeeds, or it fails with actionable compile/runtime messages that should be promoted to `P0` or `P1` findings.
```

- [ ] **Step 4: Record verification results in the report**

Append this subsection under `## Build And Runtime Risks`:

```markdown
### Verification Results

- `npm run lint`: record pass/fail and the first meaningful error excerpt.
- `npm run test`: record pass/fail, failing suite names, and whether failures are product bugs or test harness issues.
- `npm run build`: record pass/fail, failing route/component/module names, and whether the issue blocks deployment.
```

- [ ] **Step 5: Commit verification notes**

```bash
git add docs/superpowers/reports/2026-04-14-project-audit-report.md
git commit -m "docs: capture audit verification results"
```

### Task 3: Audit Auth, Session, And Database Foundations

**Files:**
- Modify: `docs/superpowers/reports/2026-04-14-project-audit-report.md`
- Review: `src/lib/db/prisma.ts`
- Review: `src/lib/auth/password.ts`
- Review: `src/lib/auth/session.ts`
- Review: `src/lib/auth/current-user.ts`
- Review: `src/lib/auth/team-access.ts`
- Review: `src/lib/auth/validation.ts`
- Review: `src/lib/auth/__tests__/validation.test.ts`
- Review: `src/app/api/auth/login/route.ts`
- Review: `src/app/api/auth/register/route.ts`
- Review: `src/app/api/auth/logout/route.ts`
- Review: `src/app/api/auth/me/route.ts`
- Review: `src/app/(auth)/login/page.tsx`
- Review: `src/app/(auth)/register/page.tsx`
- Review: `src/components/auth/login-form.tsx`
- Review: `src/components/auth/register-form.tsx`

- [ ] **Step 1: Review database bootstrap and session lifecycle**

Run:

```powershell
Get-Content src/lib/db/prisma.ts
Get-Content src/lib/auth/session.ts
Get-Content src/lib/auth/current-user.ts
Get-Content src/lib/auth/team-access.ts
```

Expected:

```text
You can explain how Prisma is initialized, how sessions are created/read/cleared, and where auth or authorization can fail unexpectedly.
```

- [ ] **Step 2: Review auth validation, hashing, and API behavior**

Run:

```powershell
Get-Content src/lib/auth/password.ts
Get-Content src/lib/auth/validation.ts
Get-Content src/app/api/auth/login/route.ts
Get-Content src/app/api/auth/register/route.ts
Get-Content src/app/api/auth/logout/route.ts
Get-Content src/app/api/auth/me/route.ts
Get-Content src/lib/auth/__tests__/validation.test.ts
```

Expected:

```text
You can identify invalid input handling, status-code consistency, password/security assumptions, and missing auth test coverage.
```

- [ ] **Step 3: Review auth page UX and failure handling**

Run:

```powershell
Get-Content 'src/app/(auth)/login/page.tsx'
Get-Content 'src/app/(auth)/register/page.tsx'
Get-Content src/components/auth/login-form.tsx
Get-Content src/components/auth/register-form.tsx
```

Expected:

```text
You can identify loading-state, form-error, navigation, encoding, or accessibility issues in auth flows.
```

- [ ] **Step 4: Add findings to the report**

Append findings in this format under `## Findings`:

```markdown
### Use one heading per finding with a short problem statement

- Severity: `P0` | `P1` | `P2` | `P3`
- Module: `auth` or `db`
- Location: `exact/path/to/file.tsx`
- Observed issue: concise description
- Why it matters: concise engineering explanation
- Likely impact: user-facing or operational impact
- Recommended repair direction: narrow fix direction without implementing it
```

- [ ] **Step 5: Commit auth and DB findings**

```bash
git add docs/superpowers/reports/2026-04-14-project-audit-report.md
git commit -m "docs: add auth and database audit findings"
```

### Task 4: Audit Domain Logic, Server Data Composition, And API Routes

**Files:**
- Modify: `docs/superpowers/reports/2026-04-14-project-audit-report.md`
- Review: `src/lib/domain/team.ts`
- Review: `src/lib/domain/task.ts`
- Review: `src/lib/domain/task-detail.ts`
- Review: `src/lib/domain/progress.ts`
- Review: `src/lib/domain/file.ts`
- Review: `src/lib/domain/announcement.ts`
- Review: `src/lib/domain/score.ts`
- Review: `src/lib/domain/__tests__/rules.test.ts`
- Review: `src/lib/domain/__tests__/task-detail.test.ts`
- Review: `src/lib/server/dashboard-data.ts`
- Review: `src/lib/dashboard/presenters.ts`
- Review: `src/lib/dashboard/types.ts`
- Review: `src/lib/dashboard/__tests__/presenters.test.ts`
- Review: `src/app/api/teams/route.ts`
- Review: `src/app/api/teams/[teamId]/members/route.ts`
- Review: `src/app/api/teams/[teamId]/tasks/route.ts`
- Review: `src/app/api/teams/[teamId]/tasks/[taskId]/route.ts`
- Review: `src/app/api/teams/[teamId]/files/route.ts`
- Review: `src/app/api/teams/[teamId]/files/[fileId]/route.ts`
- Review: `src/app/api/teams/[teamId]/files/[fileId]/download/route.ts`
- Review: `src/app/api/announcements/route.ts`
- Review: `src/app/api/scores/route.ts`
- Review: `src/lib/storage/team-files.ts`

- [ ] **Step 1: Review domain rules and existing unit coverage**

Run:

```powershell
Get-Content src/lib/domain/team.ts
Get-Content src/lib/domain/task.ts
Get-Content src/lib/domain/task-detail.ts
Get-Content src/lib/domain/progress.ts
Get-Content src/lib/domain/file.ts
Get-Content src/lib/domain/announcement.ts
Get-Content src/lib/domain/score.ts
Get-Content src/lib/domain/__tests__/rules.test.ts
Get-Content src/lib/domain/__tests__/task-detail.test.ts
```

Expected:

```text
You can identify business-rule gaps, schema inconsistencies, and missing tests around task state, scoring, file handling, and announcement permissions.
```

- [ ] **Step 2: Review dashboard data shaping and presenter contracts**

Run:

```powershell
Get-Content src/lib/server/dashboard-data.ts
Get-Content src/lib/dashboard/presenters.ts
Get-Content src/lib/dashboard/types.ts
Get-Content src/lib/dashboard/__tests__/presenters.test.ts
```

Expected:

```text
You can identify duplication between server and API layers, serialization risks, permission leaks, and mismatches between runtime data and UI expectations.
```

- [ ] **Step 3: Review API routes subsystem by subsystem**

Run:

```powershell
Get-Content src/app/api/teams/route.ts
Get-Content 'src/app/api/teams/[teamId]/members/route.ts'
Get-Content 'src/app/api/teams/[teamId]/tasks/route.ts'
Get-Content 'src/app/api/teams/[teamId]/tasks/[taskId]/route.ts'
Get-Content 'src/app/api/teams/[teamId]/files/route.ts'
Get-Content 'src/app/api/teams/[teamId]/files/[fileId]/route.ts'
Get-Content 'src/app/api/teams/[teamId]/files/[fileId]/download/route.ts'
Get-Content src/app/api/announcements/route.ts
Get-Content src/app/api/scores/route.ts
Get-Content src/lib/storage/team-files.ts
```

Expected:

```text
You can identify status-code problems, validation gaps, unsafe assumptions, storage edge cases, and cross-route inconsistencies.
```

- [ ] **Step 4: Add findings and focused summaries**

Append to these sections:

```markdown
## Findings

### Use one heading per finding with a short problem statement

- Severity: `P0` | `P1` | `P2` | `P3`
- Module: `domain`, `dashboard-data`, `api`, or `storage`
- Location: `exact/path/to/file.ts`
- Observed issue: concise description
- Why it matters: concise engineering explanation
- Likely impact: user-facing or operational impact
- Recommended repair direction: narrow fix direction without implementing it

## Bug Risks

- Add one bullet per bug-class issue using the format: `<severity> - <subsystem> - <short risk summary>`

## Structural Issues

- Add one bullet per structural issue using the format: `<severity> - <subsystem> - <short maintainability summary>`
```

- [ ] **Step 5: Commit domain and API findings**

```bash
git add docs/superpowers/reports/2026-04-14-project-audit-report.md
git commit -m "docs: add domain and api audit findings"
```

### Task 5: Audit Dashboard Pages, Shared UX, And Interaction Quality

**Files:**
- Modify: `docs/superpowers/reports/2026-04-14-project-audit-report.md`
- Review: `src/components/layout/dashboard-shell.tsx`
- Review: `src/components/providers/app-provider.tsx`
- Review: `src/components/ui/reveal.tsx`
- Review: `src/lib/ui/motion.ts`
- Review: `src/app/layout.tsx`
- Review: `src/app/page.tsx`
- Review: `src/app/globals.css`
- Review: `src/app/(dashboard)/layout.tsx`
- Review: `src/app/(dashboard)/teams/page.tsx`
- Review: `src/app/(dashboard)/teams/[teamId]/board/page.tsx`
- Review: `src/app/(dashboard)/teams/[teamId]/files/page.tsx`
- Review: `src/app/(dashboard)/files/page.tsx`
- Review: `src/app/(dashboard)/announcements/page.tsx`
- Review: `src/app/(dashboard)/teacher/scores/page.tsx`
- Review: `src/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Review shared shell, providers, and global styling**

Run:

```powershell
Get-Content src/components/layout/dashboard-shell.tsx
Get-Content src/components/providers/app-provider.tsx
Get-Content src/components/ui/reveal.tsx
Get-Content src/lib/ui/motion.ts
Get-Content src/app/layout.tsx
Get-Content src/app/page.tsx
Get-Content src/app/globals.css
Get-Content 'src/app/(dashboard)/layout.tsx'
```

Expected:

```text
You can identify layout regressions, navigation problems, text encoding issues, provider misuse, and global CSS risks that affect many pages at once.
```

- [ ] **Step 2: Review all dashboard pages for UX and consistency**

Run:

```powershell
Get-Content 'src/app/(dashboard)/teams/page.tsx'
Get-Content 'src/app/(dashboard)/teams/[teamId]/board/page.tsx'
Get-Content 'src/app/(dashboard)/teams/[teamId]/files/page.tsx'
Get-Content 'src/app/(dashboard)/files/page.tsx'
Get-Content 'src/app/(dashboard)/announcements/page.tsx'
Get-Content 'src/app/(dashboard)/teacher/scores/page.tsx'
Get-Content 'src/app/(dashboard)/profile/page.tsx'
```

Expected:

```text
You can identify empty-state gaps, loading-state gaps, action feedback issues, mobile layout risks, and strings or flows that undermine user trust.
```

- [ ] **Step 3: Record UX findings and summaries**

Append to these sections:

```markdown
## Findings

### Use one heading per finding with a short problem statement

- Severity: `P1` | `P2` | `P3`
- Module: `dashboard`, `layout`, or `page`
- Location: `exact/path/to/file.tsx`
- Observed issue: concise description
- Why it matters: concise engineering explanation
- Likely impact: user-facing or operational impact
- Recommended repair direction: narrow fix direction without implementing it

## UX Issues

- Add one bullet per UX issue using the format: `<severity> - <page or shell area> - <short UX summary>`
```

- [ ] **Step 4: If strings appear garbled, confirm encoding impact**

Run:

```powershell
Get-Content src/components/layout/dashboard-shell.tsx
Get-Content 'src/app/(dashboard)/teams/page.tsx'
Get-Content src/app/api/teams/route.ts
```

Expected:

```text
You can confirm whether visible Chinese strings are correctly encoded or currently broken in source output, and record this as a high-priority UX finding if reproduced.
```

- [ ] **Step 5: Commit dashboard and UX findings**

```bash
git add docs/superpowers/reports/2026-04-14-project-audit-report.md
git commit -m "docs: add dashboard ux audit findings"
```

### Task 6: Audit Test Coverage And Missing Verification

**Files:**
- Modify: `docs/superpowers/reports/2026-04-14-project-audit-report.md`
- Review: `src/lib/auth/__tests__/validation.test.ts`
- Review: `src/lib/domain/__tests__/rules.test.ts`
- Review: `src/lib/domain/__tests__/task-detail.test.ts`
- Review: `src/lib/dashboard/__tests__/presenters.test.ts`
- Review: `package.json`

- [ ] **Step 1: Inventory the existing test surface**

Run:

```powershell
rg --files src -g "*.test.*" -g "*.spec.*"
Get-Content src/lib/auth/__tests__/validation.test.ts
Get-Content src/lib/domain/__tests__/rules.test.ts
Get-Content src/lib/domain/__tests__/task-detail.test.ts
Get-Content src/lib/dashboard/__tests__/presenters.test.ts
```

Expected:

```text
You can list exactly which modules are currently covered and which product areas have no automated tests at all.
```

- [ ] **Step 2: Compare tests against audited subsystems**

Use this checklist while reviewing:

```markdown
- Auth API behavior covered?
- Session cookie behavior covered?
- Team creation and membership flows covered?
- Task creation/update flows covered?
- File upload/download/delete flows covered?
- Announcement publish permissions covered?
- Score submission/update covered?
- Dashboard page data gates covered?
```

- [ ] **Step 3: Add test-gap findings**

Append to these sections:

```markdown
## Findings

### Use one heading per finding with a short problem statement

- Severity: `P1` | `P2` | `P3`
- Module: `tests`
- Location: `exact/path/or/subsystem`
- Observed issue: concise description
- Why it matters: concise engineering explanation
- Likely impact: bug escape or refactor risk
- Recommended repair direction: narrow test addition plan without implementing it

## Test Gaps

- Add one bullet per missing test area using the format: `<severity> - <subsystem> - <missing coverage summary>`
```

- [ ] **Step 4: Commit test-gap findings**

```bash
git add docs/superpowers/reports/2026-04-14-project-audit-report.md
git commit -m "docs: add audit test coverage findings"
```

### Task 7: Prioritize Findings And Finalize The Audit Report

**Files:**
- Modify: `docs/superpowers/reports/2026-04-14-project-audit-report.md`
- Review: `docs/superpowers/specs/2026-04-14-project-audit-design.md`

- [ ] **Step 1: Normalize finding severities**

Use these exact rules while editing the report:

```markdown
- `P0`: Core flow broken, data correctness risk, auth/security risk, or build failure
- `P1`: High-frequency user impact or a problem likely to become a production issue soon
- `P2`: Important but non-blocking weakness that harms maintainability, UX, or stability
- `P3`: Lower-priority cleanup, polish, or optimization opportunity
```

- [ ] **Step 2: Order findings from highest to lowest severity**

Sort the `## Findings` section so that:

```markdown
1. `P0` findings appear first
2. `P1` findings appear second
3. `P2` findings appear third
4. `P3` findings appear last
```

- [ ] **Step 3: Write the repair sequence**

Replace the `## Suggested Repair Order` section with this structure:

```markdown
## Suggested Repair Order

1. Fix release-blocking or data-risk issues first.
2. Fix auth, permission, and route-consistency issues next.
3. Fix visible high-frequency UX issues in shared flows.
4. Add tests around unstable flows before refactoring.
5. Clean up lower-severity structural debt after behavior is protected.
```

- [ ] **Step 4: Final verification of the report artifact**

Run:

```powershell
Get-Content docs/superpowers/reports/2026-04-14-project-audit-report.md
git diff -- docs/superpowers/reports/2026-04-14-project-audit-report.md
```

Expected:

```text
The report is complete, prioritized, free of empty sections, and contains concrete engineer-usable findings rather than vague observations.
```

- [ ] **Step 5: Commit the finished audit report**

```bash
git add docs/superpowers/reports/2026-04-14-project-audit-report.md
git commit -m "docs: finalize full project audit report"
```
