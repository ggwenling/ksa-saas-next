import { UserRole } from "@prisma/client";
import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "公告标题不能为空").max(80, "公告标题最多 80 字"),
  content: z.string().trim().min(1, "公告内容不能为空").max(1000, "公告内容最多 1000 字"),
});

export function canPublishAnnouncement(role: UserRole): boolean {
  return role === UserRole.TEACHER || role === UserRole.LEADER;
}

export type AnnouncementInput = z.infer<typeof announcementSchema>;
