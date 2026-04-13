import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().nullable(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
