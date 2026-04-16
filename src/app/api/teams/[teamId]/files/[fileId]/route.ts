import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/current-user";
import { requireTeamAccess } from "@/lib/auth/team-access";
import { canDeleteTeamFile } from "@/lib/domain/file";
import { prisma } from "@/lib/db/prisma";
import { deleteTeamFileWithCompensation } from "@/lib/storage/team-file-transactions";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ teamId: string; fileId: string }>;
};

export async function DELETE(_: Request, context: Params) {
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
        id: true,
        uploaderId: true,
        relativePath: true,
      },
    });
    if (!row) {
      return NextResponse.json({ message: "文件不存在" }, { status: 404 });
    }

    if (
      !canDeleteTeamFile({
        role: auth.user.role,
        currentUserId: auth.user.id,
        uploaderId: row.uploaderId,
      })
    ) {
      return NextResponse.json(
        { message: "您没有此权限！请通知管理员修改权限" },
        { status: 403 },
      );
    }

    await deleteTeamFileWithCompensation({
      relativePath: row.relativePath,
      deleteRecord: () => prisma.teamFile.delete({ where: { id: row.id } }).then(() => undefined),
    });

    return NextResponse.json({ message: "删除文件成功" });
  } catch (error) {
    console.error("team.file.delete error", error);
    return NextResponse.json({ message: "删除文件失败，请稍后重试" }, { status: 500 });
  }
}
