import { beforeEach, describe, expect, test, vi } from "vitest";

const getCurrentUserMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const revalidatePathMock = vi.fn();
const requireTeamAccessMock = vi.fn();
const prismaMock = {
  $transaction: vi.fn(),
  user: {
    findUniqueOrThrow: vi.fn(),
  },
  team: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  teamMember: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  inviteCode: {
    create: vi.fn(),
  },
  score: {
    upsert: vi.fn(),
  },
  task: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/auth/team-access", () => ({
  requireTeamAccess: requireTeamAccessMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("server-only", () => ({}));

describe("dashboard server modules", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test("getProfilePageData returns the authenticated user for the profile page", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      username: "leader01",
      displayName: "张三",
      role: "LEADER",
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      id: "user-1",
      username: "leader01",
      displayName: "张三",
      role: "LEADER",
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
      ledTeams: [{ name: "智创小队" }],
      teams: [],
    });

    const mod = await import("../dashboard-data");

    expect(typeof (mod as { getProfilePageData?: unknown }).getProfilePageData).toBe(
      "function",
    );

    const result = await (mod as { getProfilePageData: () => Promise<unknown> }).getProfilePageData();

    expect(result).toEqual({
      profile: {
        id: "user-1",
        username: "leader01",
        displayName: "张三",
        role: "LEADER",
        roleLabel: "队长",
        teamLabel: "智创小队",
        joinedAtLabel: "2026-04-10",
      },
    });
  });

  test("createTeamAction returns a success result and revalidates the teams page", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "leader-1",
      username: "leader01",
      displayName: "队长",
      role: "LEADER",
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    );
    prismaMock.team.create.mockResolvedValue({
      id: "team-1",
      name: "智创小队",
      description: "产品组",
    });
    prismaMock.teamMember.create.mockResolvedValue({ id: "member-1" });
    prismaMock.inviteCode.create.mockResolvedValue({ id: "invite-1", code: "TEAM-123456" });

    const mod = await import("../dashboard-actions").catch(() => ({}));

    expect(typeof (mod as { createTeamAction?: unknown }).createTeamAction).toBe("function");

    const result = await (
      mod as {
        createTeamAction: (input: { name: string; description?: string | null }) => Promise<unknown>;
      }
    ).createTeamAction({
      name: "智创小队",
      description: "产品组",
    });

    expect(result).toMatchObject({
      ok: true,
      message: "创建团队成功",
      data: {
        id: "team-1",
        name: "智创小队",
        description: "产品组",
        progress: 0,
        memberCount: 1,
      },
    });
    expect((result as { data?: { inviteCode?: string | null } }).data?.inviteCode).toMatch(/^TEAM-/);
    expect(revalidatePathMock).toHaveBeenCalledWith("/teams");
  });

  test("updateTaskStatusAction blocks teachers from mutating team tasks", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "teacher-1",
      username: "teacher01",
      displayName: "老师",
      role: "TEACHER",
    });

    const mod = await import("../dashboard-actions").catch(() => ({}));

    expect(typeof (mod as { updateTaskStatusAction?: unknown }).updateTaskStatusAction).toBe(
      "function",
    );

    const result = await (
      mod as {
        updateTaskStatusAction: (
          teamId: string,
          taskId: string,
          status: "TODO" | "IN_PROGRESS" | "DONE",
        ) => Promise<unknown>;
      }
    ).updateTaskStatusAction("team-1", "task-1", "DONE");

    expect(result).toEqual({
      ok: false,
      message: "教师角色不可修改任务",
    });
    expect(prismaMock.task.update).not.toHaveBeenCalled();
  });

  test("updateTaskStatusAction returns the updated task view model for local state updates", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "leader-1",
      username: "leader01",
      displayName: "队长",
      role: "LEADER",
    });
    requireTeamAccessMock.mockResolvedValue({ ok: true });
    prismaMock.task.findFirst.mockResolvedValue({ id: "task-1" });
    prismaMock.task.update.mockResolvedValue({
      id: "task-1",
      title: "完成竞品分析",
      description: "收集行业案例",
      objective: null,
      acceptanceCriteria: null,
      nextActions: null,
      risks: null,
      deliverables: null,
      collaborationNote: null,
      priority: "高",
      status: "DONE",
      dueDate: new Date("2026-04-15T08:00:00.000Z"),
      assignee: {
        id: "member-1",
        displayName: "李四",
        username: "lisi",
      },
      creator: {
        id: "leader-1",
        displayName: "队长",
        username: "leader01",
      },
      createdAt: new Date("2026-04-14T08:00:00.000Z"),
      updatedAt: new Date("2026-04-15T08:30:00.000Z"),
    });

    const mod = await import("../dashboard-actions");
    const result = await mod.updateTaskStatusAction("team-1", "task-1", "DONE");

    expect(result).toMatchObject({
      ok: true,
      message: "更新任务成功",
      data: {
        id: "task-1",
        title: "完成竞品分析",
        status: "DONE",
        priority: "高",
        dueDate: "2026-04-15T08:00:00.000Z",
        createdAt: "2026-04-14T08:00:00.000Z",
        updatedAt: "2026-04-15T08:30:00.000Z",
      },
    });
  });

  test("saveScoreAction returns the updated score row for local state updates", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "teacher-1",
      username: "teacher01",
      displayName: "老师",
      role: "TEACHER",
    });
    prismaMock.team.findUnique.mockResolvedValue({
      id: "team-1",
      name: "智创小队",
    });
    prismaMock.score.upsert.mockResolvedValue({
      id: "score-1",
      businessPlanScore: 56,
      defenseScore: 27,
      bonusScore: 8,
      comment: "表现稳定",
      updatedAt: new Date("2026-04-15T09:00:00.000Z"),
    });

    const mod = await import("../dashboard-actions");
    const result = await mod.saveScoreAction({
      teamId: "team-1",
      businessPlanScore: 56,
      defenseScore: 27,
      bonusScore: 8,
      comment: "表现稳定",
    });

    expect(result).toMatchObject({
      ok: true,
      message: "保存评分成功",
      data: {
        teamId: "team-1",
        teamName: "智创小队",
        score: {
          id: "score-1",
          businessPlanScore: 56,
          defenseScore: 27,
          bonusScore: 8,
          comment: "表现稳定",
          updatedAt: "2026-04-15T09:00:00.000Z",
        },
      },
    });
  });
});
