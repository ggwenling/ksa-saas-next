import path from "node:path";
import { describe, expect, test } from "vitest";
import { getTeamFileAbsolutePath } from "../team-files";

describe("getTeamFileAbsolutePath", () => {
  test("resolves a normal team-relative path under storage root", () => {
    const result = getTeamFileAbsolutePath("team-1/report.pdf");

    expect(result).toContain(path.join("storage", "team-files", "team-1"));
    expect(result.endsWith(path.join("team-1", "report.pdf"))).toBe(true);
  });

  test("rejects traversal segments", () => {
    expect(() => getTeamFileAbsolutePath("../secrets.txt")).toThrow(
      "Invalid team file path",
    );
  });

  test("rejects absolute-style paths", () => {
    expect(() => getTeamFileAbsolutePath("/etc/passwd")).toThrow(
      "Invalid team file path",
    );
  });
});
