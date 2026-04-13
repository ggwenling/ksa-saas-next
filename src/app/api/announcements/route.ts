import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/current-user";
import { announcementSchema, canPublishAnnouncement } from "@/lib/domain/announcement";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }

    const rows = await prisma.announcement.findMany({
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      data: rows,
      canPublish: canPublishAnnouncement(auth.user.role),
    });
  } catch (error) {
    console.error("announcements.get error", error);
    return NextResponse.json({ message: "获取公告列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }
    if (!canPublishAnnouncement(auth.user.role)) {
      return NextResponse.json(
        { message: "您没有此权限！请通知管理员修改权限" },
        { status: 403 },
      );
    }

    const payload = await request.json();
    const parsed = announcementSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "公告参数不合法", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const created = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        authorId: auth.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "发布公告成功", data: created }, { status: 201 });
  } catch (error) {
    console.error("announcements.post error", error);
    return NextResponse.json({ message: "发布公告失败，请稍后重试" }, { status: 500 });
  }
}
