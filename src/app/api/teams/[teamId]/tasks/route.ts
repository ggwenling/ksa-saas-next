import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/auth/team-access";
import { requireUser } from "@/lib/auth/current-user";
import { createTaskSchema } from "@/lib/domain/task";
import { prisma } from "@/lib/db/prisma";

type Params = {
  params: Promise<{ teamId: string }>;
};

export async function GET(_: Request, context: Params) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }

    const { teamId } = await context.params;
    const access = await requireTeamAccess(auth.user, teamId, { allowTeacher: true });
    if (!access.ok) {
      return access.response;
    }

    const tasks = await prisma.task.findMany({
      where: { teamId },
      include: {
        assignee: {
          select: { id: true, displayName: true, username: true },
        },
        creator: {
          select: { id: true, displayName: true, username: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("team.tasks.get error", error);
    return NextResponse.json({ message: "获取任务列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request, context: Params) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }
    if (auth.user.role === UserRole.TEACHER) {
      return NextResponse.json({ message: "老师角色不可创建任务" }, { status: 403 });
    }

    const { teamId } = await context.params;
    const access = await requireTeamAccess(auth.user, teamId);
    if (!access.ok) {
      return access.response;
    }

    const payload = await request.json();
    const parsed = createTaskSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "创建任务参数不合法",
          errors: parsed.error.flatten().fieldErrors,
        },
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
        creatorId: auth.user.id,
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

    return NextResponse.json({ message: "创建任务成功", data: task }, { status: 201 });
  } catch (error) {
    console.error("team.tasks.post error", error);
    return NextResponse.json({ message: "创建任务失败，请稍后重试" }, { status: 500 });
  }
}
