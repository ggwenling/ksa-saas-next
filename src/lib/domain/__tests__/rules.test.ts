import { describe, expect, test } from "vitest";
import { announcementSchema, canPublishAnnouncement } from "../announcement";
import { canDeleteTeamFile } from "../file";
import { calculateTeamProgress } from "../progress";
import { scoreSchema } from "../score";

describe("calculateTeamProgress", () => {
  test("returns 0 when no tasks", () => {
    expect(calculateTeamProgress([])).toBe(0);
  });

  test("calculates completed ratio", () => {
    const value = calculateTeamProgress([
      { status: "TODO" },
      { status: "DONE" },
      { status: "DONE" },
      { status: "IN_PROGRESS" },
    ]);

    expect(value).toBe(50);
  });
});

describe("scoreSchema", () => {
  test("accepts valid score payload", () => {
    const result = scoreSchema.safeParse({
      teamId: "team-1",
      businessPlanScore: 58,
      defenseScore: 26,
      bonusScore: 9,
      comment: "Good work",
    });

    expect(result.success).toBe(true);
  });

  test("rejects over-range score", () => {
    const result = scoreSchema.safeParse({
      teamId: "team-1",
      businessPlanScore: 80,
      defenseScore: 26,
      bonusScore: 9,
      comment: "invalid",
    });

    expect(result.success).toBe(false);
  });
});

describe("announcementSchema", () => {
  test("accepts valid payload", () => {
    const result = announcementSchema.safeParse({
      title: "课程安排通知",
      content: "请大家本周日前完成任务拆解并提交。",
    });

    expect(result.success).toBe(true);
  });

  test("rejects empty content", () => {
    const result = announcementSchema.safeParse({
      title: "空内容测试",
      content: "   ",
    });

    expect(result.success).toBe(false);
  });
});

describe("canPublishAnnouncement", () => {
  test("allows teacher and leader", () => {
    expect(canPublishAnnouncement("TEACHER")).toBe(true);
    expect(canPublishAnnouncement("LEADER")).toBe(true);
  });

  test("forbids member", () => {
    expect(canPublishAnnouncement("MEMBER")).toBe(false);
  });
});

describe("canDeleteTeamFile", () => {
  test("allows uploader to delete own file", () => {
    const ok = canDeleteTeamFile({
      role: "MEMBER",
      currentUserId: "u1",
      uploaderId: "u1",
    });
    expect(ok).toBe(true);
  });

  test("allows leader and teacher to delete any file", () => {
    const leaderOk = canDeleteTeamFile({
      role: "LEADER",
      currentUserId: "u2",
      uploaderId: "u1",
    });
    const teacherOk = canDeleteTeamFile({
      role: "TEACHER",
      currentUserId: "u3",
      uploaderId: "u1",
    });
    expect(leaderOk).toBe(true);
    expect(teacherOk).toBe(true);
  });

  test("forbids member deleting others file", () => {
    const ok = canDeleteTeamFile({
      role: "MEMBER",
      currentUserId: "u2",
      uploaderId: "u1",
    });
    expect(ok).toBe(false);
  });
});
