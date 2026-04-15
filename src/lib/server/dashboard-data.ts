import "server-only";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { canPublishAnnouncement } from "@/lib/domain/announcement";
import {
  presentAnnouncements,
  presentProfile,
  presentTeamFiles,
  presentTeamSummaries,
  presentTeacherScores,
} from "@/lib/dashboard/presenters";
import type {
  AnnouncementRow,
  ProfileSummary,
  ScoreRow,
  TaskItem,
  TeamFileRow,
  TeamMember,
  TeamSummary,
} from "@/lib/dashboard/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

async function getDashboardUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

async function ensureTeamAccess(
  user: Awaited<ReturnType<typeof getDashboardUser>>,
  teamId: string,
  options?: { allowTeacher?: boolean },
) {
  if (options?.allowTeacher && user.role === UserRole.TEACHER) {
    return;
  }

  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!membership) {
    redirect("/teams");
  }
}

function serializeTask(row: {
  id: string;
  title: string;
  description: string | null;
  objective: string | null;
  acceptanceCriteria: string | null;
  nextActions: string | null;
  risks: string | null;
  deliverables: string | null;
  collaborationNote: string | null;
  priority: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: Date | null;
  assignee: { id: string; displayName: string; username: string } | null;
  creator: { id: string; displayName: string; username: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    objective: row.objective,
    acceptanceCriteria: row.acceptanceCriteria,
    nextActions: row.nextActions,
    risks: row.risks,
    deliverables: row.deliverables,
    collaborationNote: row.collaborationNote,
    priority: row.priority,
    status: row.status,
    dueDate: row.dueDate?.toISOString() ?? null,
    assignee: row.assignee,
    creator: row.creator,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getTeamsPageData(): Promise<{ teams: TeamSummary[] }> {
  const user = await getDashboardUser();

  const teamRows =
    user.role === UserRole.TEACHER
      ? await prisma.team.findMany({
          include: {
            tasks: {
              select: {
                status: true,
              },
            },
            members: {
              select: {
                id: true,
              },
            },
            inviteCodes: {
              where: { isActive: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { code: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : (
          await prisma.teamMember.findMany({
            where: { userId: user.id },
            include: {
              team: {
                include: {
                  tasks: { select: { status: true } },
                  members: { select: { id: true } },
                  inviteCodes: {
                    where: { isActive: true },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { code: true },
                  },
                },
              },
            },
            orderBy: { joinedAt: "desc" },
          })
        ).map((item) => item.team);

  return {
    teams: presentTeamSummaries(teamRows, user.id),
  };
}

export async function getAnnouncementsPageData(): Promise<{
  rows: AnnouncementRow[];
  canPublish: boolean;
}> {
  const user = await getDashboardUser();
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

  return {
    rows: presentAnnouncements(rows),
    canPublish: canPublishAnnouncement(user.role),
  };
}

export async function getFilesEntryPageData(): Promise<{ teams: TeamSummary[] }> {
  return getTeamsPageData();
}

export async function getTeacherScoresPageData(): Promise<{ rows: ScoreRow[] }> {
  const user = await getDashboardUser();
  if (user.role !== UserRole.TEACHER) {
    redirect("/teams");
  }

  const teams = await prisma.team.findMany({
    include: {
      scores: {
        where: { teacherId: user.id },
        select: {
          id: true,
          businessPlanScore: true,
          defenseScore: true,
          bonusScore: true,
          comment: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    rows: presentTeacherScores(teams),
  };
}

export async function getTeamFilesPageData(teamId: string): Promise<{
  teamId: string;
  rows: TeamFileRow[];
}> {
  const user = await getDashboardUser();
  await ensureTeamAccess(user, teamId, { allowTeacher: true });

  const rows = await prisma.teamFile.findMany({
    where: { teamId },
    include: {
      uploader: {
        select: { id: true, displayName: true, username: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    teamId,
    rows: presentTeamFiles(rows, user),
  };
}

export async function getTeamBoardPageData(teamId: string): Promise<{
  teamId: string;
  tasks: TaskItem[];
  members: TeamMember[];
}> {
  const user = await getDashboardUser();
  await ensureTeamAccess(user, teamId, { allowTeacher: true });

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { teamId },
      include: {
        assignee: {
          select: { id: true, displayName: true, username: true },
        },
        creator: {
          select: { id: true, displayName: true, username: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.teamMember.findMany({
      where: { teamId },
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
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  return {
    teamId,
    tasks: tasks.map(serializeTask),
    members: members.map((item) => item.user),
  };
}

export async function getProfilePageData(): Promise<{ profile: ProfileSummary }> {
  const user = await getDashboardUser();

  const row = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
      ledTeams: {
        select: { name: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      teams: {
        select: {
          team: {
            select: { name: true },
          },
        },
        orderBy: { joinedAt: "asc" },
        take: 1,
      },
    },
  });

  return {
    profile: presentProfile(row),
  };
}
