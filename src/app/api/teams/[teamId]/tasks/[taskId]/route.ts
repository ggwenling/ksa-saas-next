import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/auth/team-access";
import { requireUser } from "@/lib/auth/current-user";
import { updateTaskSchema } from "@/lib/domain/task";
import { prisma } from "@/lib/db/prisma";

type Params = {
  params: Promise<{ teamId: string; taskId: string }>;
};

export async function PATCH(request: Request, context: Params) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }
    if (auth.user.role === UserRole.TEACHER) {
      return NextResponse.json({ message: "老师角色不可修改任务" }, { status: 403 });
    }

    const { teamId, taskId } = await context.params;
    const access = await requireTeamAccess(auth.user, teamId);
    if (!access.ok) {
      return access.response;
    }

    const payload = await request.json();
    const parsed = updateTaskSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "更新任务参数不合法", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
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
        return NextResponse.json({ message: "所选负责人不在当前团队中" }, { status: 400 });
      }
    }

    const targetTask = await prisma.task.findFirst({
      where: { id: taskId, teamId },
      select: { id: true },
    });
    if (!targetTask) {
      return NextResponse.json({ message: "任务不存在" }, { status: 404 });
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

    return NextResponse.json({ message: "更新任务成功", data: task });
  } catch (error) {
    console.error("team.task.patch error", error);
    return NextResponse.json({ message: "更新任务失败，请稍后重试" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }
    if (auth.user.role === UserRole.TEACHER) {
      return NextResponse.json({ message: "老师角色不可删除任务" }, { status: 403 });
    }

    const { teamId, taskId } = await context.params;
    const access = await requireTeamAccess(auth.user, teamId);
    if (!access.ok) {
      return access.response;
    }

    const targetTask = await prisma.task.findFirst({
      where: { id: taskId, teamId },
      select: { id: true },
    });
    if (!targetTask) {
      return NextResponse.json({ message: "任务不存在" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "删除任务成功" });
  } catch (error) {
    console.error("team.task.delete error", error);
    return NextResponse.json({ message: "删除任务失败，请稍后重试" }, { status: 500 });
  }
}
