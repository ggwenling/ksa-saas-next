import { beforeEach, describe, expect, test, vi } from "vitest";

const comparePassword = vi.fn();
const createSession = vi.fn();
const setSessionCookie = vi.fn();
const findUnique = vi.fn();

vi.mock("@/lib/auth/password", () => ({
  comparePassword,
}));

vi.mock("@/lib/auth/session", () => ({
  createSession,
  setSessionCookie,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique,
    },
  },
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSession.mockResolvedValue({
      token: "session-token",
      expiresAt: new Date("2026-04-20T00:00:00.000Z"),
    });
    setSessionCookie.mockResolvedValue(undefined);
  });

  test("returns a generic 401 for a missing account", async () => {
    findUnique.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "missing-user",
          password: "Passw0rd!",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      message: "账号或密码错误",
    });
  });

  test("returns the same generic 401 for an inactive account", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      username: "member01",
      displayName: "Member One",
      role: "MEMBER",
      isActive: false,
      passwordHash: "hashed-password",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "member01",
          password: "Passw0rd!",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      message: "账号或密码错误",
    });
  });

  test("returns the same generic 401 for a wrong password", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      username: "member01",
      displayName: "Member One",
      role: "MEMBER",
      isActive: true,
      passwordHash: "hashed-password",
    });
    comparePassword.mockResolvedValue(false);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "member01",
          password: "wrong-password",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      message: "账号或密码错误",
    });
  });
});
