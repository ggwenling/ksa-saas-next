import { UserRole } from "@prisma/client";

type DeleteFileInput = {
  role: UserRole;
  currentUserId: string;
  uploaderId: string;
};

export function canDeleteTeamFile(input: DeleteFileInput): boolean {
  if (input.currentUserId === input.uploaderId) {
    return true;
  }
  return input.role === UserRole.LEADER || input.role === UserRole.TEACHER;
}
