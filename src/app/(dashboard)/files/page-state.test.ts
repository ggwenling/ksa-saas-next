import { describe, expect, test, vi } from "vitest";
import { loadFilesEntryPageData, type TeamCard } from "./page-state";

function createResponse(ok: boolean, json: unknown) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(json),
  } as unknown as Response;
}

describe("loadFilesEntryPageData", () => {
  test("returns rows on success", async () => {
    const rows: TeamCard[] = [
      {
        id: "team-1",
        name: "Alpha",
        description: null,
        progress: 50,
        memberCount: 2,
        inviteCode: null,
      },
    ];

    const result = await loadFilesEntryPageData(() =>
      Promise.resolve(createResponse(true, { data: rows })),
    );

    expect(result).toEqual({
      status: "ready",
      rows,
    });
  });

  test("returns an error message when the request fails", async () => {
    const result = await loadFilesEntryPageData(() =>
      Promise.resolve(createResponse(false, { message: "获取团队列表失败" })),
    );

    expect(result).toEqual({
      status: "error",
      message: "获取团队列表失败",
    });
  });

  test("returns a fallback error when the request throws", async () => {
    const result = await loadFilesEntryPageData(() => Promise.reject(new Error("network")));

    expect(result).toEqual({
      status: "error",
      message: "网络异常，请稍后重试",
    });
  });
});
