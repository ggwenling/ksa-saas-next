import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import type { AuthUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

type TeamAccessOptions = {
  allowTeacher?: boolean;
};

export async function requireTeamAccess(
  user: AuthUser,
  teamId: string,
  options?: TeamAccessOptions,
) {
  if (options?.allowTeacher && user.role === UserRole.TEACHER) {
    return { ok: true as const };
  }

  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!membership) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "无权访问该团队" }, { status: 403 }),
    };
  }
  return { ok: true as const };
}
