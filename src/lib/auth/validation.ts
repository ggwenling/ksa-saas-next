import { z } from "zod";

const roleSchema = z.enum(["LEADER", "MEMBER", "TEACHER"]);

const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .regex(/[A-Za-z]/, "密码必须包含字母")
  .regex(/[0-9]/, "密码必须包含数字");

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "账号至少 3 位")
      .max(24, "账号最多 24 位")
      .regex(/^[A-Za-z0-9_]+$/, "账号只能包含字母、数字和下划线"),
    password: passwordSchema,
    role: roleSchema,
    displayName: z
      .string()
      .trim()
      .min(2, "昵称至少 2 位")
      .max(30, "昵称最多 30 位"),
    inviteCode: z.string().trim().min(6).max(32).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "MEMBER" && !data.inviteCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inviteCode"],
        message: "队员注册必须填写邀请码",
      });
    }
  });

export const loginSchema = z.object({
  username: z.string().trim().min(1, "账号不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
