import { describe, expect, test } from "vitest";
import { loginSchema, registerSchema } from "../validation";
import { comparePassword, hashPassword } from "../password";

describe("registerSchema", () => {
  test("accepts valid team leader payload", () => {
    const result = registerSchema.safeParse({
      username: "leader01",
      password: "Passw0rd!",
      role: "LEADER",
      displayName: "组长A",
      inviteCode: null,
    });

    expect(result.success).toBe(true);
  });

  test("rejects teammate registration without invite code", () => {
    const result = registerSchema.safeParse({
      username: "member01",
      password: "Passw0rd!",
      role: "MEMBER",
      displayName: "队员A",
      inviteCode: null,
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  test("rejects blank username", () => {
    const result = loginSchema.safeParse({
      username: " ",
      password: "Passw0rd!",
    });

    expect(result.success).toBe(false);
  });
});

describe("password helper", () => {
  test("hashes and compares password", async () => {
    const raw = "Passw0rd!";
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    await expect(comparePassword(raw, hashed)).resolves.toBe(true);
    await expect(comparePassword("wrong", hashed)).resolves.toBe(false);
  });
});
