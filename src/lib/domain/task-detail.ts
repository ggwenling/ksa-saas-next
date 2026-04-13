type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type Person = {
  displayName: string;
  username: string;
} | null;

type TaskDetailInput = {
  title: string;
  description: string | null;
  objective: string | null;
  acceptanceCriteria: string | null;
  nextActions: string | null;
  risks: string | null;
  deliverables: string | null;
  collaborationNote: string | null;
  priority: "高" | "中" | "低" | null;
  status: TaskStatus;
  assignee: Person;
  creator: Exclude<Person, null>;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskTemplate = {
  objective: string;
  acceptanceCriteria: string[];
  nextActions: string[];
  risks: string[];
  deliverables: string[];
  collaborationNote: string;
  priority: "高" | "中" | "低";
};

function splitLines(value: string | null): string[] | null {
  if (!value) return null;

  const lines = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines : null;
}

function resolveTemplate(title: string): TaskTemplate {
  if (/[市调竞品市场]/.test(title)) {
    return {
      objective:
        "围绕目标市场与竞品格局输出可用于计划书撰写的分析结论，支撑项目定位与竞争优势判断。",
      acceptanceCriteria: [
        "至少整理 3 个同类产品或项目案例",
        "输出一版对比表，覆盖功能、价格、差异化卖点",
        "形成可直接引用到计划书中的分析结论",
      ],
      nextActions: [
        "补充竞品截图、产品链接与摘要",
        "整理目标用户痛点，关联到项目价值主张",
        "将分析结果同步给路演与文案负责人",
      ],
      risks: [
        "样本不足会导致市场判断失真",
        "信息来源过旧可能影响结论可信度",
      ],
      deliverables: ["竞品分析表", "市场洞察摘要", "计划书引用段落"],
      collaborationNote:
        "建议和路演负责人同步结论，确保计划书与答辩表达口径一致。",
      priority: "高",
    };
  }

  if (/[路演答辩演讲PPT讲稿]/.test(title)) {
    return {
      objective:
        "完成一版适合课堂答辩的路演结构，突出问题、方案、价值与执行路径。",
      acceptanceCriteria: [
        "路演结构完整，包含项目背景、解决方案、商业模式、财务预测",
        "演讲顺序控制在课堂时间范围内",
        "每页信息重点明确，便于团队成员分工讲解",
      ],
      nextActions: [
        "与商业计划书内容做交叉校验",
        "补充关键数据和案例截图",
        "安排一次内部彩排并收集团队反馈",
      ],
      risks: [
        "内容过多会导致答辩超时",
        "核心卖点不聚焦会削弱说服力",
      ],
      deliverables: ["路演PPT大纲", "讲稿要点", "彩排反馈记录"],
      collaborationNote:
        "建议由创建人先定讲述结构，再与团队成员分配页面讲解职责。",
      priority: "高",
    };
  }

  if (/[分工角色团队]/.test(title)) {
    return {
      objective:
        "明确团队成员职责边界，确保每个阶段都有清晰负责人和交付对象。",
      acceptanceCriteria: [
        "团队成员均有明确职责",
        "职责与项目阶段相匹配",
        "后续任务能按负责人继续拆解",
      ],
      nextActions: [
        "确认每位成员的当前投入时间",
        "将角色对应到现有任务看板",
        "同步给全体成员并确认无遗漏",
      ],
      risks: [
        "职责分配不均会影响执行效率",
        "角色重叠可能导致沟通成本上升",
      ],
      deliverables: ["角色分工表", "职责说明", "任务负责人映射清单"],
      collaborationNote:
        "建议创建人负责最终拍板，负责人只需关注自己交付模块。",
      priority: "中",
    };
  }

  return {
    objective:
      "推动当前任务按计划完成，确保其结果能够直接支撑团队整体交付进度。",
    acceptanceCriteria: [
      "任务描述完整且可执行",
      "输出物明确，便于团队接力使用",
      "任务状态与实际进度保持一致",
    ],
    nextActions: [
      "补充执行细节并确认负责人",
      "与相关成员同步当前进展",
      "在截止前完成自检与结果提交",
    ],
    risks: [
      "需求理解不一致会影响交付质量",
      "中间结果未及时同步可能导致返工",
    ],
    deliverables: ["任务执行记录", "阶段性成果", "最终提交物"],
    collaborationNote:
      "建议把任务结果同步到公告或文件中心，方便团队成员快速查看。",
    priority: "中",
  };
}

function getProgressPercent(status: TaskStatus): number {
  if (status === "DONE") return 100;
  if (status === "IN_PROGRESS") return 60;
  return 20;
}

function getProgressStatus(status: TaskStatus): string {
  if (status === "DONE") {
    return "当前任务已进入收尾完成状态，可用于汇总和复盘。";
  }
  if (status === "IN_PROGRESS") {
    return "任务正在推进中，建议优先完成关键输出物并同步中间结果。";
  }
  return "任务尚未正式启动，建议尽快明确负责人和第一步动作。";
}

export function buildTaskDetail(task: TaskDetailInput) {
  const template = resolveTemplate(task.title);

  return {
    summary: {
      assigneeLabel: task.assignee
        ? `${task.assignee.displayName}（${task.assignee.username}）`
        : "未分配",
      creatorLabel: `${task.creator.displayName}（${task.creator.username}）`,
      dueDateLabel: task.dueDate ? task.dueDate.slice(0, 10) : "未设置",
      createdAtLabel: task.createdAt.slice(0, 16),
      updatedAtLabel: task.updatedAt.slice(0, 16),
      priority: task.priority ?? template.priority,
    },
    objective: task.objective?.trim() || template.objective,
    taskBackground:
      task.description?.trim() ||
      "该任务用于支撑团队阶段性成果输出，建议结合计划书、路演和任务看板联动推进。",
    acceptanceCriteria: splitLines(task.acceptanceCriteria) ?? template.acceptanceCriteria,
    nextActions: splitLines(task.nextActions) ?? template.nextActions,
    risks: splitLines(task.risks) ?? template.risks,
    deliverables: splitLines(task.deliverables) ?? template.deliverables,
    collaborationNote: task.collaborationNote?.trim() || template.collaborationNote,
    progressPercent: getProgressPercent(task.status),
    progressStatus: getProgressStatus(task.status),
  };
}

export type BuiltTaskDetail = ReturnType<typeof buildTaskDetail>;
