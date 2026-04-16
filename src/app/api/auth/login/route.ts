import { NextResponse } from "next/server";
import { comparePassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "登录参数不合法",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const matched = await comparePassword(password, user.passwordHash);
    if (!matched) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({
      message: "登录成功",
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ message: "登录失败，请稍后重试" }, { status: 500 });
  }
}
