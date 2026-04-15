"use server";

import { randomUUID } from "node:crypto";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { presentAnnouncements, presentTaskItems, presentTeacherScores } from "@/lib/dashboard/presenters";
import type {
  DashboardActionResult,
  DashboardFieldErrors,
  TeamSummary,
  TaskItem,
  AnnouncementRow,
  ScoreRow,
} from "@/lib/dashboard/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireTeamAccess } from "@/lib/auth/team-access";
import { announcementSchema, canPublishAnnouncement } from "@/lib/domain/announcement";
import { canDeleteTeamFile } from "@/lib/domain/file";
import { scoreSchema } from "@/lib/domain/score";
import { createTaskSchema, updateTaskSchema } from "@/lib/domain/task";
import { createTeamSchema } from "@/lib/domain/team";
import { prisma } from "@/lib/db/prisma";
import { removeTeamFile } from "@/lib/storage/team-files";

function ok<T>(message: string, data?: T): DashboardActionResult<T> {
  return data === undefined ? { ok: true, message } : { ok: true, message, data };
}

function fail(message: string, errors?: DashboardFieldErrors): DashboardActionResult {
  return errors ? { ok: false, message, errors } : { ok: false, message };
}

function buildInviteCode() {
  return `TEAM-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function requireActionUser() {
  return getCurrentUser();
}

function revalidateTaskPaths(teamId: string) {
  revalidatePath("/teams");
  revalidatePath("/files");
  revalidatePath(`/teams/${teamId}/board`);
}

export async function createTeamAction(input: {
  name: string;
  description?: string | null;
}): Promise<DashboardActionResult<TeamSummary>> {
  const user = await requireActionUser();
  if (!user) {
    return fail("未登录或登录已过期");
  }
  if (user.role !== UserRole.LEADER) {
    return fail("仅队长可创建团队");
  }

  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) {
    return fail("创建团队参数不合法", parsed.error.flatten().fieldErrors);
  }

  const inviteCode = buildInviteCode();
  const team = await prisma.$transaction(async (tx) => {
    const created = await tx.team.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        leaderId: user.id,
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: created.id,
        userId: user.id,
      },
    });

    await tx.inviteCode.create({
      data: {
        code: inviteCode,
        teamId: created.id,
        createdById: user.id,
      },
    });

    return created;
  });

  revalidatePath("/teams");
  revalidatePath("/files");

  return ok("创建团队成功", {
    id: team.id,
    name: team.name,
    description: team.description,
    progress: 0,
    memberCount: 1,
    inviteCode,
  });
}

export async function publishAnnouncementAction(input: {
  title: string;
  content: string;
}): Promise<DashboardActionResult<AnnouncementRow>> {
  const user = await requireActionUser();
  if (!user) {
    return fail("未登录或登录已过期");
  }
  if (!canPublishAnnouncement(user.role)) {
    return fail("您没有此权限，请联系管理员");
  }

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return fail("公告参数不合法", parsed.error.flatten().fieldErrors);
  }

  const created = await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      authorId: user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          username: true,
          role: true,
        },
      },
    },
  });

  revalidatePath("/announcements");

  return ok("发布公告成功", presentAnnouncements([created])[0]);
}

export async function saveScoreAction(input: {
  teamId: string;
  businessPlanScore: number;
  defenseScore: number;
  bonusScore: number;
  comment?: string | null;
}): Promise<DashboardActionResult<ScoreRow>> {
  const user = await requireActionUser();
  if (!user) {
    return fail("未登录或登录已过期");
  }
  if (user.role !== UserRole.TEACHER) {
    return fail("您没有此权限，请联系管理员");
  }

  const parsed = scoreSchema.safeParse(input);
  if (!parsed.success) {
    return fail("评分参数不合法", parsed.error.flatten().fieldErrors);
  }

  const team = await prisma.team.findUnique({
    where: { id: parsed.data.teamId },
    select: { id: true, name: true },
  });

  if (!team) {
    return fail("团队不存在");
  }

  const record = await prisma.score.upsert({
    where: {
      teamId_teacherId: {
        teamId: parsed.data.teamId,
        teacherId: user.id,
      },
    },
    update: {
      businessPlanScore: parsed.data.businessPlanScore,
      defenseScore: parsed.data.defenseScore,
      bonusScore: parsed.data.bonusScore,
      comment: parsed.data.comment ?? null,
    },
    create: {
      teamId: parsed.data.teamId,
      teacherId: user.id,
      businessPlanScore: parsed.data.businessPlanScore,
      defenseScore: parsed.data.defenseScore,
      bonusScore: parsed.data.bonusScore,
      comment: parsed.data.comment ?? null,
    },
  });

  revalidatePath("/teacher/scores");

  return ok(
    "保存评分成功",
    presentTeacherScores([
      {
        id: team.id,
        name: team.name,
        scores: [record],
      },
    ])[0],
  );
}

export async function createTaskAction(
  teamId: string,
  input: Parameters<typeof createTaskSchema.safeParse>[0],
): Promise<DashboardActionResult<TaskItem>> {
  const user = await requireActionUser();
  if (!user) {
    return fail("未登录或登录已过期");
  }
  if (user.role === UserRole.TEACHER) {
    return fail("教师角色不可创建任务");
  }

  const access = await requireTeamAccess(user, teamId);
  if (!access.ok) {
    return fail("无权访问该团队");
  }

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return fail("创建任务参数不合法", parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.assigneeId) {
    const hasAssignee = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: parsed.data.assigneeId,
      },
      select: { id: true },
    });

    if (!hasAssignee) {
      return fail("所选负责人不在当前团队中");
    }
  }

  const task = await prisma.task.create({
    data: {
      teamId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      objective: parsed.data.objective ?? null,
      acceptanceCriteria: parsed.data.acceptanceCriteria ?? null,
      nextActions: parsed.data.nextActions ?? null,
      risks: parsed.data.risks ?? null,
      deliverables: parsed.data.deliverables ?? null,
      collaborationNote: parsed.data.collaborationNote ?? null,
      priority: parsed.data.priority ?? null,
      assigneeId: parsed.data.assigneeId ?? null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      creatorId: user.id,
    },
    include: {
      assignee: {
        select: { id: true, displayName: true, username: true },
      },
      creator: {
        select: { id: true, displayName: true, username: true },
      },
    },
  });

  revalidateTaskPaths(teamId);

  return ok("创建任务成功", presentTaskItems([task])[0]);
}

export async function updateTaskAction(
  teamId: string,
  taskId: string,
  input: Parameters<typeof updateTaskSchema.safeParse>[0],
): Promise<DashboardActionResult<TaskItem>> {
  const user = await requireActionUser();
  if (!user) {
    return fail("未登录或登录已过期");
  }
  if (user.role === UserRole.TEACHER) {
    return fail("教师角色不可修改任务");
  }

  const access = await requireTeamAccess(user, teamId);
  if (!access.ok) {
    return fail("无权访问该团队");
  }

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return fail("更新任务参数不合法", parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.assigneeId) {
    const hasAssignee = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: parsed.data.assigneeId,
      },
      select: { id: true },
    });

    if (!hasAssignee) {
      return fail("所选负责人不在当前团队中");
    }
  }

  const targetTask = await prisma.task.findFirst({
    where: { id: taskId, teamId },
    select: { id: true },
  });
  if (!targetTask) {
    return fail("任务不存在");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      objective: parsed.data.objective,
      acceptanceCriteria: parsed.data.acceptanceCriteria,
      nextActions: parsed.data.nextActions,
      risks: parsed.data.risks,
      deliverables: parsed.data.deliverables,
      collaborationNote: parsed.data.collaborationNote,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId,
      status: parsed.data.status,
      dueDate:
        parsed.data.dueDate === undefined
          ? undefined
          : parsed.data.dueDate
            ? new Date(parsed.data.dueDate)
            : null,
    },
    include: {
      assignee: {
        select: { id: true, displayName: true, username: true },
      },
      creator: {
        select: { id: true, displayName: true, username: true },
      },
    },
  });

  revalidateTaskPaths(teamId);

  return ok("更新任务成功", presentTaskItems([task])[0]);
}

export async function updateTaskStatusAction(
  teamId: string,
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "DONE",
): Promise<DashboardActionResult<TaskItem>> {
  return updateTaskAction(teamId, taskId, { status });
}

export async function deleteTaskAction(
  teamId: string,
  taskId: string,
): Promise<DashboardActionResult<{ taskId: string }>> {
  const user = await requireActionUser();
  if (!user) {
    return fail("未登录或登录已过期");
  }
  if (user.role === UserRole.TEACHER) {
    return fail("教师角色不可删除任务");
  }

  const access = await requireTeamAccess(user, teamId);
  if (!access.ok) {
    return fail("无权访问该团队");
  }

  const targetTask = await prisma.task.findFirst({
    where: { id: taskId, teamId },
    select: { id: true },
  });
  if (!targetTask) {
    return fail("任务不存在");
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidateTaskPaths(teamId);

  return ok("删除任务成功", { taskId });
}

export async function deleteTeamFileAction(
  teamId: string,
  fileId: string,
): Promise<DashboardActionResult<{ fileId: string }>> {
  const user = await requireActionUser();
  if (!user) {
    return fail("未登录或登录已过期");
  }

  const access = await requireTeamAccess(user, teamId, { allowTeacher: true });
  if (!access.ok) {
    return fail("无权访问该团队");
  }

  const row = await prisma.teamFile.findFirst({
    where: { id: fileId, teamId },
    select: {
      id: true,
      uploaderId: true,
      relativePath: true,
    },
  });
  if (!row) {
    return fail("文件不存在");
  }

  if (
    !canDeleteTeamFile({
      role: user.role,
      currentUserId: user.id,
      uploaderId: row.uploaderId,
    })
  ) {
    return fail("您没有此权限，请联系管理员");
  }

  await prisma.teamFile.delete({ where: { id: row.id } });
  await removeTeamFile(row.relativePath);

  revalidatePath(`/teams/${teamId}/files`);

  return ok("删除文件成功", { fileId });
}
