# 2026-04-14 Project Audit Report

# 2026-04-14 Project Audit Report

## Health Overview

- Repository snapshot: Next.js app with auth, dashboard, teams, tasks, files, announcements, scores, and profile flows.
- Current scripts checked: `dev`, `build`, `start`, `lint`, `test`, `db:seed`.
- Data layer checked: Prisma + SQLite with session, team, task, score, announcement, and file models.
- Audit mode: read-only code review plus verification commands, report only.

## Baseline Inventory

- `AGENTS.md` warns this variant of Next.js has breaking differences and directs us to `node_modules/next/dist/docs`.
- `package.json` shows Next 16.2.3 with React 19, Prisma 7, Ant Design, Tailwind 4 tooling, and scripts for `dev`, `build`, `start`, `lint`, `test`, and `db:seed`.
- The audit design spec enumerates a full-project read-only review covering auth, dashboard, teams, tasks, files, announcements, scores, profile, Prisma wiring, APIs, and tests, with verification commands and developer-facing output.
- `prisma/schema.prisma` targets SQLite and models users, teams, tasks, scores, announcements, sessions, invite codes, and team files with cascades plus enums for `UserRole` and `TaskStatus`.
- `rg --files src prisma docs/superpowers` confirms the source layout: lib auth/dashboard/domain utilities, API route hierarchy (`app/api/...`), components, providers, CSS, Prisma migrations, and audit docs/scripts.
- `git log --oneline -5` shows the two latest docs commits (audit plan and design) plus `fix:4.13` and the original Create Next App seed.

## Findings

## Bug Risks

## Test Gaps

## UX Issues

## Structural Issues

## Build And Runtime Risks

## Suggested Repair Order
