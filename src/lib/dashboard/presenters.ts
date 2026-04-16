import { calculateTeamProgress } from "../domain/progress";
import { canDeleteTeamFile } from "../domain/file";
import type {
  AnnouncementRow,
  ProfileSummary,
  ScoreRow,
  TaskItem,
  TeamFileRow,
  TeamSummary,
} from "./types";

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

type TeamSummarySource = {
  id: string;
  name: string;
  description: string | null;
  leaderId: string;
  tasks: Array<{ status: "TODO" | "IN_PROGRESS" | "DONE" }>;
  members: Array<{ id: string }>;
  inviteCodes: Array<{ code: string }>;
};

export function presentTeamSummaries(
  rows: TeamSummarySource[],
  currentUserId: string,
): TeamSummary[] {
  return rows.map((team) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    progress: calculateTeamProgress(team.tasks),
    memberCount: team.members.length,
    inviteCode: team.leaderId === currentUserId ? team.inviteCodes[0]?.code ?? null : null,
  }));
}

type AnnouncementSource = {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
  author: AnnouncementRow["author"];
};

export function presentAnnouncements(rows: AnnouncementSource[]): AnnouncementRow[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: toIsoString(row.createdAt),
    author: row.author,
  }));
}

type TeacherScoreSource = {
  id: string;
  name: string;
  scores: Array<{
    id: string;
    businessPlanScore: number;
    defenseScore: number;
    bonusScore: number;
    comment: string | null;
    updatedAt: Date | string;
  }>;
};

export function presentTeacherScores(rows: TeacherScoreSource[]): ScoreRow[] {
  return rows.map((team) => {
    const score = team.scores[0];
    return {
      teamId: team.id,
      teamName: team.name,
      score: score
        ? {
            id: score.id,
            businessPlanScore: score.businessPlanScore,
            defenseScore: score.defenseScore,
            bonusScore: score.bonusScore,
            comment: score.comment,
            updatedAt: toIsoString(score.updatedAt),
          }
        : null,
    };
  });
}

type TaskItemSource = {
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
  dueDate: Date | string | null;
  assignee: TaskItem["assignee"];
  creator: TaskItem["creator"];
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function presentTaskItems(rows: TaskItemSource[]): TaskItem[] {
  return rows.map((row) => ({
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
    dueDate: row.dueDate ? toIsoString(row.dueDate) : null,
    assignee: row.assignee,
    creator: row.creator,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }));
}

type TeamFileSource = {
  id: string;
  originalName: string;
  size: number;
  mimeType: string | null;
  createdAt: Date | string;
  uploaderId: string;
  uploader: TeamFileRow["uploader"];
};

export function presentTeamFiles(
  rows: TeamFileSource[],
  currentUser: { id: string; role: TeamFileRow["uploader"]["role"] },
): TeamFileRow[] {
  return rows.map((row) => ({
    id: row.id,
    originalName: row.originalName,
    size: row.size,
    mimeType: row.mimeType,
    createdAt: toIsoString(row.createdAt),
    uploader: row.uploader,
    canDelete: canDeleteTeamFile({
      role: currentUser.role,
      currentUserId: currentUser.id,
      uploaderId: row.uploaderId,
    }),
  }));
}

type ProfileSource = {
  id: string;
  username: string;
  displayName: string;
  role: ProfileSummary["role"];
  createdAt: Date | string;
  ledTeams: Array<{ name: string }>;
  teams: Array<{ team: { name: string } }>;
};

const roleLabels: Record<ProfileSummary["role"], string> = {
  LEADER: "队长",
  MEMBER: "队员",
  TEACHER: "老师",
};

export function presentProfile(row: ProfileSource): ProfileSummary {
  const createdAt = toIsoString(row.createdAt).slice(0, 10);
  const primaryTeam =
    row.ledTeams[0]?.name ??
    row.teams[0]?.team.name ??
    (row.role === "TEACHER" ? "教师账号" : "未加入团队");

  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    roleLabel: roleLabels[row.role],
    teamLabel: primaryTeam,
    joinedAtLabel: createdAt,
  };
}
