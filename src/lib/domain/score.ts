import { z } from "zod";

export const scoreSchema = z.object({
  teamId: z.string().trim().min(1),
  businessPlanScore: z.number().int().min(0).max(60),
  defenseScore: z.number().int().min(0).max(30),
  bonusScore: z.number().int().min(0).max(10),
  comment: z.string().trim().max(300).optional().nullable(),
});

export type ScoreInput = z.infer<typeof scoreSchema>;
