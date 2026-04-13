import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/auth/team-access";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { getTeamFileAbsolutePath } from "@/lib/storage/team-files";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ teamId: string; fileId: string }>;
};

export async function GET(_: Request, context: Params) {
  try {
    const auth = await requireUser();
    if (!auth.ok) {
      return auth.response;
    }

    const { teamId, fileId } = await context.params;
    const access = await requireTeamAccess(auth.user, teamId, { allowTeacher: true });
    if (!access.ok) {
      return access.response;
    }

    const row = await prisma.teamFile.findFirst({
      where: { id: fileId, teamId },
      select: {
        originalName: true,
        mimeType: true,
        relativePath: true,
      },
    });
    if (!row) {
      return NextResponse.json({ message: "文件不存在" }, { status: 404 });
    }

    const absPath = getTeamFileAbsolutePath(row.relativePath);
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(absPath);
    } catch {
      return NextResponse.json({ message: "文件已丢失，请联系管理员" }, { status: 404 });
    }

    const encodedName = encodeURIComponent(row.originalName);
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": row.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      },
    });
  } catch (error) {
    console.error("team.file.download error", error);
    return NextResponse.json({ message: "下载文件失败，请稍后重试" }, { status: 500 });
  }
}
