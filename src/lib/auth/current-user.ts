import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionTokenFromCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionTokenFromCookie();
  if (!token) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
    },
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
  });

  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "未登录或登录已过期" }, { status: 401 }),
    };
  }
  return { ok: true as const, user };
}

export function requireRole(user: AuthUser, roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "您没有此权限！请通知管理员修改权限" },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const };
}