# Project Audit Design

**Date:** 2026-04-14
**Scope:** Full-project audit for `kas-saas-next`
**Type:** Read-only audit and prioritization, no implementation changes in this phase

## Background

The project is a relatively small Next.js application with auth, dashboard, teams, tasks, files, announcements, scores, and profile flows. The immediate goal for today is not to implement features or fixes, but to produce a developer-facing audit that identifies bugs, risks, UX issues, testing gaps, and structural weaknesses across the full project.

## Goal

Produce a full-project audit report that:

- covers the whole application, not only the main flow
- prioritizes findings for engineers
- highlights bugs, stability risks, UX issues, and test gaps
- gives repair guidance without making code changes yet

## Non-Goals

- No feature delivery in this phase
- No production refactor in this phase
- No speculative optimization without evidence
- No PM-style or executive summary as the main output

## Audit Strategy

This audit follows a balanced approach:

1. Perform static review of project structure, shared utilities, pages, API routes, and domain logic.
2. Run available verification commands such as lint, tests, and build.
3. Inspect representative end-to-end paths by tracing page, data, and API interactions.
4. Organize findings into a developer-facing prioritized report.

This approach is preferred because it provides better coverage than a read-only review while staying faster and more focused than a full QA pass.

## Coverage Areas

The audit covers all major product and technical areas in the repository:

- authentication flows
- dashboard shell and shared layout/navigation
- teams and task management flows
- file management and download/upload related paths
- announcements
- teacher scoring flows
- profile area
- database access and Prisma wiring
- server-side data composition
- client-side rendering and interaction quality
- API route behavior and consistency
- existing automated test coverage

## Review Dimensions

Each area is reviewed through five lenses:

### 1. Functional Bugs

Check for broken logic, incorrect state transitions, missing validation, bad error handling, auth issues, route mismatch, and edge-case failures.

### 2. Code Quality and Maintainability

Check for unclear responsibilities, duplication, fragile coupling, inconsistent data contracts, and files that are likely to become defect hotspots.

### 3. Test Quality

Check whether important business rules and runtime paths have automated coverage, whether existing tests map to real behavior, and where missing tests create blind spots.

### 4. Performance and Stability

Check for unnecessary client work, suspicious data loading patterns, build-time fragility, runtime assumptions, and unstable infrastructure choices.

### 5. User Experience

Check for visible text issues, loading/empty/error states, poor feedback after actions, navigation inconsistencies, and interaction points that feel unreliable or confusing.

## Deliverable Format

The audit output should be a developer-facing report with these sections:

### 1. Health Overview

A concise assessment of current project health, highest-risk areas, and overall confidence in the codebase.

### 2. Findings

Each finding should include:

- title
- severity (`P0` to `P3`)
- module
- location
- observed issue
- why it matters
- likely impact
- recommended repair direction

### 3. Focused Summaries

Grouped summaries for:

- bug risks
- test gaps
- UX issues
- structural issues
- build or runtime risks

### 4. Suggested Repair Order

A practical engineer-first sequence for what to address next.

## Severity Rules

- `P0`: Core flow broken, data correctness risk, auth/security risk, or build failure
- `P1`: High-frequency user impact or a problem likely to become a production issue soon
- `P2`: Important but non-blocking weakness that harms maintainability, UX, or stability
- `P3`: Lower-priority cleanup, polish, or optimization opportunity

## Expected Timebox

For this repository size, the audit is expected to take roughly 2.5 to 4 hours for a complete pass with a usable developer-facing report. A more deeply annotated report may take 3.5 to 5 hours.

## Acceptance Criteria

This design is complete when:

- the whole project is included in scope
- the audit remains read-only
- verification commands are part of the process
- findings are prioritized for developers
- the output clearly separates bugs, risks, UX issues, and test gaps
- the next implementation phase can be planned directly from the report
