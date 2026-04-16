import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  deleteTeamFileWithCompensation,
  saveTeamFileWithCompensation,
} from "../team-file-transactions";
import { prepareTeamFileRemoval, removeTeamFile, saveTeamFile } from "../team-files";

vi.mock("../team-files", () => ({
  saveTeamFile: vi.fn(),
  removeTeamFile: vi.fn(),
  prepareTeamFileRemoval: vi.fn(),
}));

describe("saveTeamFileWithCompensation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("removes the saved file when record creation fails", async () => {
    vi.mocked(saveTeamFile).mockResolvedValue({
      absolutePath: "D:\\temp\\team-1\\report.pdf",
      relativePath: "team-1/report.pdf",
    });

    const createRecord = vi.fn().mockRejectedValue(new Error("db failed"));

    await expect(
      saveTeamFileWithCompensation({
        teamId: "team-1",
        storedName: "report.pdf",
        data: Buffer.from("demo"),
        createRecord,
      }),
    ).rejects.toThrow("db failed");

    expect(removeTeamFile).toHaveBeenCalledWith("team-1/report.pdf");
  });

  test("returns the created record when persistence succeeds", async () => {
    vi.mocked(saveTeamFile).mockResolvedValue({
      absolutePath: "D:\\temp\\team-1\\report.pdf",
      relativePath: "team-1/report.pdf",
    });

    const createRecord = vi.fn().mockResolvedValue({ id: "file-1" });

    await expect(
      saveTeamFileWithCompensation({
        teamId: "team-1",
        storedName: "report.pdf",
        data: Buffer.from("demo"),
        createRecord,
      }),
    ).resolves.toEqual({ id: "file-1" });
  });
});

describe("deleteTeamFileWithCompensation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("restores the file when record deletion fails", async () => {
    const restore = vi.fn().mockResolvedValue(undefined);
    const commit = vi.fn().mockResolvedValue(undefined);

    vi.mocked(prepareTeamFileRemoval).mockResolvedValue({
      restore,
      commit,
    });

    const deleteRecord = vi.fn().mockRejectedValue(new Error("delete failed"));

    await expect(
      deleteTeamFileWithCompensation({
        relativePath: "team-1/report.pdf",
        deleteRecord,
      }),
    ).rejects.toThrow("delete failed");

    expect(restore).toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  test("commits file removal after record deletion succeeds", async () => {
    const restore = vi.fn().mockResolvedValue(undefined);
    const commit = vi.fn().mockResolvedValue(undefined);

    vi.mocked(prepareTeamFileRemoval).mockResolvedValue({
      restore,
      commit,
    });

    const deleteRecord = vi.fn().mockResolvedValue(undefined);

    await expect(
      deleteTeamFileWithCompensation({
        relativePath: "team-1/report.pdf",
        deleteRecord,
      }),
    ).resolves.toBeUndefined();

    expect(commit).toHaveBeenCalled();
    expect(restore).not.toHaveBeenCalled();
  });
});
