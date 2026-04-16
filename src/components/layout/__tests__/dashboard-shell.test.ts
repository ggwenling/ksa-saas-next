import { describe, expect, test } from "vitest";
import { getDashboardSelectedKey, getLogoutResult } from "../dashboard-shell";

describe("getDashboardSelectedKey", () => {
  test("selects files for the top-level files page", () => {
    expect(getDashboardSelectedKey("/files")).toEqual(["/files"]);
  });

  test("keeps teams selected for nested team file routes", () => {
    expect(getDashboardSelectedKey("/teams/seed-team-001/files")).toEqual(["/teams"]);
  });

  test("selects teacher scores for teacher routes", () => {
    expect(getDashboardSelectedKey("/teacher/scores")).toEqual(["/teacher/scores"]);
  });

  test("falls back to teams when no menu item matches", () => {
    expect(getDashboardSelectedKey("/unknown")).toEqual(["/teams"]);
  });
});

describe("getLogoutResult", () => {
  test("returns success feedback when logout request succeeds", () => {
    expect(getLogoutResult(true)).toEqual({
      type: "success",
      message: "已退出登录",
      shouldRedirect: true,
    });
  });

  test("returns error feedback and avoids redirect when logout request fails", () => {
    expect(getLogoutResult(false)).toEqual({
      type: "error",
      message: "退出失败，请稍后重试",
      shouldRedirect: false,
    });
  });
});
