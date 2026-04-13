import { describe, expect, test } from "vitest";
import {
  presentAnnouncements,
  presentTeamFiles,
  presentTeamSummaries,
  presentTeacherScores,
} from "../presenters";

describe("presentTeamSummaries", () => {
  test("hides invite code for non-leader members", () => {
    const result = presentTeamSummaries(
      [
        {
          id: "team-1",
          name: "Alpha",
          description: "desc",
          leaderId: "leader-1",
          tasks: [{ status: "DONE" }, { status: "TODO" }],
          members: [{ id: "leader-1" }, { id: "member-1" }],
          inviteCodes: [{ code: "TEAM-1234" }],
        },
      ],
      "member-1",
    );

    expect(result).toEqual([
      {
        id: "team-1",
        name: "Alpha",
        description: "desc",
        progress: 50,
        memberCount: 2,
        inviteCode: null,
      },
    ]);
  });

  test("shows invite code for the team leader", () => {
    const result = presentTeamSummaries(
      [
        {
          id: "team-1",
          name: "Alpha",
          description: null,
          leaderId: "leader-1",
          tasks: [{ status: "DONE" }],
          members: [{ id: "leader-1" }],
          inviteCodes: [{ code: "TEAM-1234" }],
        },
      ],
      "leader-1",
    );

    expect(result[0]?.inviteCode).toBe("TEAM-1234");
  });
});

describe("presentAnnouncements", () => {
  test("serializes dates to iso strings", () => {
    const result = presentAnnouncements([
      {
        id: "a1",
        title: "Notice",
        content: "Body",
        createdAt: new Date("2026-04-10T10:00:00.000Z"),
        author: {
          id: "u1",
          displayName: "Teacher",
          username: "teacher",
          role: "TEACHER",
        },
      },
    ]);

    expect(result[0]?.createdAt).toBe("2026-04-10T10:00:00.000Z");
  });
});

describe("presentTeacherScores", () => {
  test("uses the first matching score row when present", () => {
    const result = presentTeacherScores([
      {
        id: "team-1",
        name: "Alpha",
        scores: [
          {
            id: "score-1",
            businessPlanScore: 55,
            defenseScore: 26,
            bonusScore: 8,
            comment: "Strong",
            updatedAt: new Date("2026-04-10T10:00:00.000Z"),
          },
        ],
      },
    ]);

    expect(result).toEqual([
      {
        teamId: "team-1",
        teamName: "Alpha",
        score: {
          id: "score-1",
          businessPlanScore: 55,
          defenseScore: 26,
          bonusScore: 8,
          comment: "Strong",
          updatedAt: "2026-04-10T10:00:00.000Z",
        },
      },
    ]);
  });
});

describe("presentTeamFiles", () => {
  test("adds deletion permission per current user", () => {
    const result = presentTeamFiles(
      [
        {
          id: "file-1",
          originalName: "roadmap.pdf",
          size: 1024,
          mimeType: "application/pdf",
          createdAt: new Date("2026-04-10T10:00:00.000Z"),
          uploaderId: "owner-1",
          uploader: {
            id: "owner-1",
            displayName: "Owner",
            username: "owner",
            role: "MEMBER",
          },
        },
      ],
      {
        id: "leader-1",
        role: "LEADER",
      },
    );

    expect(result[0]).toMatchObject({
      id: "file-1",
      canDelete: true,
      createdAt: "2026-04-10T10:00:00.000Z",
    });
  });
});
