import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionTokenFromCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const token = await getSessionTokenFromCookie();
    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ message: "已退出登录" });
  } catch (error) {
    console.error("logout error", error);
    return NextResponse.json({ message: "退出失败，请稍后重试" }, { status: 500 });
  }
}
