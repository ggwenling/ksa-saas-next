import { beforeEach, describe, expect, test, vi } from "vitest";

const getSessionTokenFromCookie = vi.fn();
const findFirst = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getSessionTokenFromCookie,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    session: {
      findFirst,
    },
  },
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null when the matched user's account is inactive", async () => {
    getSessionTokenFromCookie.mockResolvedValue("session-token");
    findFirst.mockResolvedValue({
      user: {
        id: "user-1",
        username: "member01",
        displayName: "Member One",
        role: "MEMBER",
        isActive: false,
      },
    });

    const { getCurrentUser } = await import("../current-user");

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  test("returns the user when the matched account is active", async () => {
    getSessionTokenFromCookie.mockResolvedValue("session-token");
    findFirst.mockResolvedValue({
      user: {
        id: "user-1",
        username: "member01",
        displayName: "Member One",
        role: "MEMBER",
        isActive: true,
      },
    });

    const { getCurrentUser } = await import("../current-user");

    await expect(getCurrentUser()).resolves.toMatchObject({
      id: "user-1",
      username: "member01",
      displayName: "Member One",
      role: "MEMBER",
    });
  });
});
