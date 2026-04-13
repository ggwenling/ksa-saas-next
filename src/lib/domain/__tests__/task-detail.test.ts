import { describe, expect, test } from "vitest";
import { buildTaskDetail } from "../task-detail";

describe("buildTaskDetail", () => {
  test("includes creator and rich detail content", () => {
    const detail = buildTaskDetail({
      title: "完成竞品市场分析",
      description: "收集竞品资料并输出分析结论",
      objective: null,
      acceptanceCriteria: null,
      nextActions: null,
      risks: null,
      deliverables: null,
      collaborationNote: null,
      priority: null,
      status: "IN_PROGRESS",
      assignee: { displayName: "李明", username: "liming" },
      creator: { displayName: "张三", username: "zhangsan" },
      dueDate: "2026-04-18T08:00:00.000Z",
      createdAt: "2026-04-10T08:00:00.000Z",
      updatedAt: "2026-04-12T08:00:00.000Z",
    });

    expect(detail.progressPercent).toBe(60);
    expect(detail.summary.creatorLabel).toContain("张三");
    expect(detail.objective).toContain("市场");
    expect(detail.acceptanceCriteria.length).toBeGreaterThan(1);
    expect(detail.nextActions.length).toBeGreaterThan(1);
  });

  test("builds done-state detail", () => {
    const detail = buildTaskDetail({
      title: "完成团队角色分工",
      description: null,
      objective: null,
      acceptanceCriteria: null,
      nextActions: null,
      risks: null,
      deliverables: null,
      collaborationNote: null,
      priority: null,
      status: "DONE",
      assignee: null,
      creator: { displayName: "王芳", username: "wangfang" },
      dueDate: null,
      createdAt: "2026-04-10T08:00:00.000Z",
      updatedAt: "2026-04-13T08:00:00.000Z",
    });

    expect(detail.progressPercent).toBe(100);
    expect(detail.progressStatus).toContain("已进入收尾");
  });

  test("prefers stored task detail fields when provided", () => {
    const detail = buildTaskDetail({
      title: "准备答辩讲稿",
      description: "用于答辩彩排",
      objective: "完成一版 5 分钟讲稿",
      acceptanceCriteria: "讲稿结构完整\n每页要点清晰",
      nextActions: "补充案例\n安排彩排",
      risks: "时间不足",
      deliverables: "讲稿文档\n演讲提词卡",
      collaborationNote: "和路演同学同步口径",
      priority: "高",
      status: "TODO",
      assignee: { displayName: "赵敏", username: "zhaomin" },
      creator: { displayName: "王帆", username: "wangfan" },
      dueDate: null,
      createdAt: "2026-04-10T08:00:00.000Z",
      updatedAt: "2026-04-10T08:00:00.000Z",
    });

    expect(detail.objective).toBe("完成一版 5 分钟讲稿");
    expect(detail.acceptanceCriteria[0]).toBe("讲稿结构完整");
    expect(detail.deliverables[1]).toBe("演讲提词卡");
    expect(detail.summary.priority).toBe("高");
  });
});
