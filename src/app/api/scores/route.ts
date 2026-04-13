import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/lib/auth/current-user";
import { scoreSchema } from "@/lib/domain/score";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }
    const roleCheck = requireRole(auth.user, [UserRole.TEACHER]);
    if (!roleCheck.ok) {
      return roleCheck.response;
    }

    const teams = await prisma.team.findMany({
      include: {
        scores: {
          where: { teacherId: auth.user.id },
          select: {
            id: true,
            businessPlanScore: true,
            defenseScore: true,
            bonusScore: true,
            comment: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = teams.map((team) => {
      const score = team.scores[0] ?? null;
      return {
        teamId: team.id,
        teamName: team.name,
        score,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("scores.get error", error);
    return NextResponse.json({ message: "获取评分列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }
    const roleCheck = requireRole(auth.user, [UserRole.TEACHER]);
    if (!roleCheck.ok) {
      return roleCheck.response;
    }

    const payload = await request.json();
    const parsed = scoreSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "评分参数不合法",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: parsed.data.teamId },
      select: { id: true },
    });
    if (!team) {
      return NextResponse.json({ message: "团队不存在" }, { status: 404 });
    }

    const record = await prisma.score.upsert({
      where: {
        teamId_teacherId: {
          teamId: parsed.data.teamId,
          teacherId: auth.user.id,
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
        teacherId: auth.user.id,
        businessPlanScore: parsed.data.businessPlanScore,
        defenseScore: parsed.data.defenseScore,
        bonusScore: parsed.data.bonusScore,
        comment: parsed.data.comment ?? null,
      },
    });

    return NextResponse.json({ message: "保存评分成功", data: record });
  } catch (error) {
    console.error("scores.post error", error);
    return NextResponse.json({ message: "保存评分失败，请稍后重试" }, { status: 500 });
  }
}
