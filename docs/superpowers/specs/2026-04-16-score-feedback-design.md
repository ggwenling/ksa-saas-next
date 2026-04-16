# Score Feedback Design

**Date:** 2026-04-16
**Scope:** Add a student-facing score feedback center for the `kas-saas-next` dashboard
**Type:** Incremental product feature with role-aware permissions and navigation cleanup

## Background

The current product already supports teacher scoring through `/teacher/scores`, while student-side users can manage teams, tasks, files, announcements, and profile information. In practice, this means the platform can collect evaluation data but does not yet complete the feedback loop for the teams being evaluated.

Leaders and members currently cannot view the score records and comments that teachers submit for their teams. At the same time, the dashboard navigation is only partially role-aware, so some users can see entry points for actions they cannot actually perform.

This design adds a read-only score feedback center for team members and leaders, while keeping teacher scoring as the only write path.

## Goal

Add a new dashboard area where `LEADER` and `MEMBER` users can view teacher feedback for their own teams, with each teacher's score shown independently.

The feature should:

- close the teacher-to-team feedback loop
- preserve strict write permissions for teachers only
- keep team data isolated so users only see scores for teams they belong to
- align dashboard navigation with role permissions more clearly than today

## Confirmed Product Decisions

The feature design is based on these approved decisions:

1. All members of a team can view score feedback for their own team.
2. When multiple teachers score the same team, the UI shows each teacher's score independently instead of showing only a merged summary.
3. Score feedback lives on its own dashboard page with its own menu item rather than being embedded into the team board.

## Non-Goals

- No new student-side score editing or reply flow
- No teacher-side redesign of the existing scoring form
- No score aggregation rules beyond per-record total display
- No cross-team visibility for leaders or members
- No broad dashboard refactor beyond the navigation changes needed to support clearer role-based access

## User Experience

### Student-Side Entry

Add a new dashboard menu item for score feedback.

- `LEADER` and `MEMBER` users see the menu item
- `TEACHER` users do not see the menu item
- the page route is `/score-feedback`

The page is a read-only dashboard view that explains the purpose of the area and then shows score feedback grouped by the user's teams.

### Page Structure

The page has two content layers:

1. A top summary panel that explains this page contains teacher evaluations and comments for the current user's teams.
2. A grouped list of team score sections.

Each team section contains:

- team name
- a short supporting description if present
- a list of teacher score cards for that team

Each teacher score card contains:

- teacher display name
- business plan score
- defense score
- bonus score
- total score
- teacher comment
- last updated time

The page is intentionally read-only. It should not contain any action buttons, forms, or edit affordances that might imply students can change the result.

## Empty and Edge States

### No Team Membership

If the current user is not part of any team, the page should show a gentle empty state explaining that there is no score feedback yet because the user has not joined a team.

### Team Has No Scores Yet

If the current user belongs to one or more teams but a given team has not received any teacher scores yet, that team section should still render and show a clear team-level empty state explaining that no teacher score has been submitted yet.

### Teacher Access

If a `TEACHER` user requests `/score-feedback` directly, the route should redirect to `/teacher/scores`.

### Unauthenticated Access

If an unauthenticated visitor requests `/score-feedback`, the route should redirect to `/login`, consistent with the existing dashboard pattern.

### Error Handling

Unexpected failures should fall back to the existing app-level handling conventions. The feature should not expose raw database or internal server details in the UI.

## Permissions

### Read Permissions

- `LEADER`: can view score feedback for teams they belong to
- `MEMBER`: can view score feedback for teams they belong to
- `TEACHER`: cannot use the student-facing score feedback page

### Write Permissions

- only `TEACHER` users can create or update score records
- `LEADER` and `MEMBER` users never receive score write affordances on this feature

### Team Isolation

Leaders and members can only view scores for teams where they have a `TeamMember` record. They must not be able to view score feedback for unrelated teams, even if they know or guess a team id.

## Data Model Impact

No schema change is required for this feature.

The existing `Score` model already contains:

- `teamId`
- `teacherId`
- score fields
- `comment`
- `updatedAt`

The existing relations are sufficient to support this page, as long as the server query includes the teacher identity for presentation.

## Data Flow

### Read Path

Use server-side data composition, following the current `dashboard-data.ts` pattern.

Recommended new server data function:

- `getScoreFeedbackPageData()`

The read flow should:

1. Require a dashboard user.
2. Redirect teachers to `/teacher/scores`.
3. Query only teams the current user belongs to.
4. For each accessible team, include:
   - team id
   - team name
   - team description
   - all score records for that team
   - each score record's teacher display name and username
5. Serialize the result into dashboard-safe types for the client component.

### Presentation Layer

Add dedicated dashboard types and presenter helpers for the feedback page instead of overloading the teacher scoring types.

Recommended additions:

- a `ScoreFeedbackTeam` type for each accessible team
- a `ScoreFeedbackRecord` type for each teacher evaluation entry
- a presenter function that converts raw Prisma rows into client-safe serialized data

Each feedback record should carry a computed total score for rendering convenience.

### Revalidation

When a teacher saves a score in `/teacher/scores`, the server action should also revalidate `/score-feedback` in addition to the existing teacher page refresh.

This keeps the student-side feedback page synchronized without introducing a separate public API just for reading score feedback.

## Routing and Navigation

### New Route

Add:

- `src/app/(dashboard)/score-feedback/page.tsx`

This route should load data server-side and render a dedicated client component for the page body.

### New Client Component

Add:

- `src/components/dashboard/score-feedback-page-client.tsx`

This component is responsible only for read-only presentation:

- header panel
- team grouping
- score cards
- empty states

It should not own any mutation logic.

### Navigation Cleanup

As part of this feature, update dashboard navigation to better match role permissions.

Minimum navigation cleanup for this scope:

- show the teacher scoring menu item only to `TEACHER`
- show the score feedback menu item only to `LEADER` and `MEMBER`

This keeps the new feature coherent with the permission model and removes an existing source of confusion where users can see routes they cannot meaningfully use.

## Testing

The implementation should include focused coverage in the existing testing style.

### Data and Permission Tests

Cover server-side behavior for:

- members can load score feedback for their own teams
- leaders can load score feedback for their own teams
- teachers are redirected away from the feedback page
- users do not receive unrelated teams in the result
- multiple teachers for one team produce multiple feedback records
- total score values are computed correctly

### Presenter Tests

Cover serialization and presentation rules for:

- empty team score lists
- multiple teams
- multiple teacher records per team
- comment and timestamp formatting inputs

### Update Path Tests

Extend teacher score save verification so that score submission revalidates:

- `/teacher/scores`
- `/score-feedback`

### UI Expectations

The page should visibly handle:

- no teams
- teams with no scores
- teams with one score
- teams with several teacher scores

## Implementation Boundaries

The intended code change surface is:

- `src/lib/server/dashboard-data.ts`
- `src/lib/dashboard/types.ts`
- `src/lib/dashboard/presenters.ts`
- `src/lib/server/dashboard-actions.ts`
- `src/components/layout/dashboard-shell.tsx`
- `src/app/(dashboard)/score-feedback/page.tsx`
- `src/components/dashboard/score-feedback-page-client.tsx`
- relevant tests in the dashboard server and presenter test suites

No database migration is required for this feature.

## Acceptance Criteria

This design is complete when:

- a score feedback menu item exists for leaders and members only
- `/score-feedback` renders for leaders and members and redirects teachers away
- users only see teacher feedback for teams they belong to
- each teacher's score appears as an independent record
- each record displays score breakdown, total score, comment, and updated time
- teams with no scores still render with a clear empty state
- teacher score saves refresh the feedback page
- navigation better reflects the role model for score-related pages
