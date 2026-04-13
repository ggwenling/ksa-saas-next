import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "未登录或登录已过期" }, { status: 401 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("me error", error);
    return NextResponse.json({ message: "获取当前用户信息失败" }, { status: 500 });
  }
}
