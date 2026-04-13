export type TeamSummary = {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  memberCount: number;
  inviteCode: string | null;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username: string;
    role: "LEADER" | "MEMBER" | "TEACHER";
  };
};

export type ScoreRow = {
  teamId: string;
  teamName: string;
  score: {
    id: string;
    businessPlanScore: number;
    defenseScore: number;
    bonusScore: number;
    comment: string | null;
    updatedAt: string;
  } | null;
};

export type TeamFileRow = {
  id: string;
  originalName: string;
  size: number;
  mimeType: string | null;
  createdAt: string;
  uploader: {
    id: string;
    displayName: string;
    username: string;
    role: "TEACHER" | "LEADER" | "MEMBER";
  };
  canDelete: boolean;
};

export type TeamMember = {
  id: string;
  displayName: string;
  username: string;
  role?: "TEACHER" | "LEADER" | "MEMBER";
};

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPerson = {
  id: string;
  displayName: string;
  username: string;
} | null;

export type TaskItem = {
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
  status: TaskStatus;
  dueDate: string | null;
  assignee: TaskPerson;
  creator: TaskPerson;
  createdAt: string;
  updatedAt: string;
};
