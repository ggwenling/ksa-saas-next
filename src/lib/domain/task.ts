import { z } from "zod";

const isoDateString = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime({ local: true }));

const detailText = z.string().trim().max(1000).optional().nullable();
const nullableTrimmedId = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
}, z.string().optional().nullable());

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().nullable(),
  objective: detailText,
  acceptanceCriteria: detailText,
  nextActions: detailText,
  risks: detailText,
  deliverables: detailText,
  collaborationNote: detailText,
  priority: z.enum(["高", "中", "低"]).optional().nullable(),
  assigneeId: nullableTrimmedId,
  dueDate: isoDateString.optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  objective: detailText,
  acceptanceCriteria: detailText,
  nextActions: detailText,
  risks: detailText,
  deliverables: detailText,
  collaborationNote: detailText,
  priority: z.enum(["高", "中", "低"]).nullable().optional(),
  assigneeId: nullableTrimmedId,
  dueDate: isoDateString.nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
