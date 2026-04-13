import { UserRole } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/current-user";
import { calculateTeamProgress } from "@/lib/domain/progress";
import { createTeamSchema } from "@/lib/domain/team";
import { prisma } from "@/lib/db/prisma";

function buildInviteCode() {
  return `TEAM-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }

    const user = auth.user;

    const teamRows =
      user.role === UserRole.TEACHER
        ? await prisma.team.findMany({
            include: {
              tasks: {
                select: {
                  status: true,
                },
              },
              members: {
                select: {
                  id: true,
                },
              },
              inviteCodes: {
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { code: true },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : (
            await prisma.teamMember.findMany({
              where: { userId: user.id },
              include: {
                team: {
                  include: {
                    tasks: { select: { status: true } },
                    members: { select: { id: true } },
                    inviteCodes: {
                      where: { isActive: true },
                      orderBy: { createdAt: "desc" },
                      take: 1,
                      select: { code: true },
                    },
                  },
                },
              },
              orderBy: { joinedAt: "desc" },
            })
          ).map((item) => item.team);

    const teams = teamRows.map((team) => {
      return {
        id: team.id,
        name: team.name,
        description: team.description,
        progress: calculateTeamProgress(team.tasks),
        memberCount: team.members.length,
        inviteCode: team.leaderId === user.id ? team.inviteCodes[0]?.code ?? null : null,
      };
    });

    return NextResponse.json({ data: teams });
  } catch (error) {
    console.error("teams.get error", error);
    return NextResponse.json({ message: "获取团队列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }
    if (auth.user.role !== UserRole.LEADER) {
      return NextResponse.json({ message: "仅队长可创建团队" }, { status: 403 });
    }

    const payload = await request.json();
    const parsed = createTeamSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "创建团队参数不合法", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          leaderId: auth.user.id,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: created.id,
          userId: auth.user.id,
        },
      });

      const inviteCode = buildInviteCode();
      await tx.inviteCode.create({
        data: {
          code: inviteCode,
          teamId: created.id,
          createdById: auth.user.id,
        },
      });

      return { ...created, inviteCode };
    });

    return NextResponse.json(
      {
        message: "创建团队成功",
        data: {
          id: team.id,
          name: team.name,
          description: team.description,
          inviteCode: team.inviteCode,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("teams.post error", error);
    return NextResponse.json({ message: "创建团队失败，请稍后重试" }, { status: 500 });
  }
}
