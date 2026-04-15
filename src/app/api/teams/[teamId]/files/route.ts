import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/auth/team-access";
import { requireUser } from "@/lib/auth/current-user";
import { presentTeamFiles } from "@/lib/dashboard/presenters";
import { prisma } from "@/lib/db/prisma";
import { generateStoredName, saveTeamFile } from "@/lib/storage/team-files";

export const runtime = "nodejs";

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

    const rows = await prisma.teamFile.findMany({
      where: { teamId },
      include: {
        uploader: {
          select: { id: true, displayName: true, username: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: presentTeamFiles(rows, auth.user),
    });
  } catch (error) {
    console.error("team.files.get error", error);
    return NextResponse.json({ message: "获取文件列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request, context: Params) {
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

    const formData = await request.formData();
    const rawFile = formData.get("file");
    if (
      !rawFile ||
      typeof rawFile !== "object" ||
      !("arrayBuffer" in rawFile) ||
      !("size" in rawFile)
    ) {
      return NextResponse.json({ message: "请选择要上传的文件" }, { status: 400 });
    }

    const file = rawFile as File;
    const fileName = "name" in file && typeof file.name === "string" ? file.name : "未命名文件";
    const mimeType = "type" in file && typeof file.type === "string" ? file.type : "";

    if (file.size <= 0) {
      return NextResponse.json({ message: "文件内容为空，无法上传" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ message: "文件不能超过 50MB" }, { status: 400 });
    }

    const storedName = generateStoredName(fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    const pathInfo = await saveTeamFile({ teamId, storedName, data: buffer });

    const created = await prisma.teamFile.create({
      data: {
        teamId,
        uploaderId: auth.user.id,
        originalName: fileName,
        storedName,
        mimeType: mimeType || null,
        size: file.size,
        relativePath: pathInfo.relativePath,
      },
      include: {
        uploader: {
          select: { id: true, displayName: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "上传文件成功",
        data: presentTeamFiles([created], auth.user)[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("team.files.post error", error);
    return NextResponse.json({ message: "上传文件失败，请稍后重试" }, { status: 500 });
  }
}
