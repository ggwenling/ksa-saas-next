import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

function buildInviteCode() {
  return `TEAM-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "注册参数不合法",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { username, password, role, displayName, inviteCode } = parsed.data;

    if (role === "TEACHER") {
      return NextResponse.json(
        { message: "老师账号需要由系统预置，暂不支持公开注册" },
        { status: 403 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ message: "账号已存在，请更换后重试" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    if (role === "LEADER") {
      const user = await prisma.user.create({
        data: {
          username,
          displayName,
          role: "LEADER",
          passwordHash,
        },
      });

      const team = await prisma.team.create({
        data: {
          name: `${displayName}的小组`,
          leaderId: user.id,
          members: {
            create: {
              userId: user.id,
            },
          },
        },
      });

      const generatedCode = buildInviteCode();
      await prisma.inviteCode.create({
        data: {
          code: generatedCode,
          teamId: team.id,
          createdById: user.id,
        },
      });

      return NextResponse.json(
        {
          message: "注册成功",
          data: {
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              role: user.role,
            },
            team: {
              id: team.id,
              name: team.name,
              inviteCode: generatedCode,
            },
          },
        },
        { status: 201 },
      );
    }

    const codeRecord = await prisma.inviteCode.findUnique({
      where: { code: inviteCode ?? "" },
      include: { team: true },
    });

    if (!codeRecord || !codeRecord.isActive) {
      return NextResponse.json({ message: "邀请码不存在或已失效" }, { status: 404 });
    }
    if (codeRecord.expiresAt && codeRecord.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ message: "邀请码已过期" }, { status: 410 });
    }
    if (codeRecord.usedCount >= codeRecord.maxUses) {
      return NextResponse.json({ message: "邀请码使用次数已达上限" }, { status: 410 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        role: "MEMBER",
        passwordHash,
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: codeRecord.teamId,
        userId: user.id,
      },
    });

    await prisma.inviteCode.update({
      where: { id: codeRecord.id },
      data: { usedCount: { increment: 1 } },
    });

    return NextResponse.json(
      {
        message: "注册成功",
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
          },
          team: {
            id: codeRecord.team.id,
            name: codeRecord.team.name,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ message: "注册失败，请稍后重试" }, { status: 500 });
  }
}
