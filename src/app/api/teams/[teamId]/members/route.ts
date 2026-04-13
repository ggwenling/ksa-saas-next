import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/auth/team-access";
import { requireUser } from "@/lib/auth/current-user";
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

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      data: members.map((item) => item.user),
    });
  } catch (error) {
    console.error("team.members.get error", error);
    return NextResponse.json({ message: "获取团队成员失败" }, { status: 500 });
  }
}
