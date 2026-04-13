import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "team-files");

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[\\/:*?"<>|]/g, "_");
}

export async function ensureTeamFileDir(teamId: string): Promise<string> {
  const teamDir = path.join(STORAGE_ROOT, teamId);
  await mkdir(teamDir, { recursive: true });
  return teamDir;
}

export function generateStoredName(originalName: string): string {
  const safeName = sanitizeFileName(originalName);
  const ext = path.extname(safeName);
  return `${Date.now()}-${randomUUID()}${ext}`;
}

export async function saveTeamFile(params: {
  teamId: string;
  storedName: string;
  data: Buffer;
}) {
  const teamDir = await ensureTeamFileDir(params.teamId);
  const absPath = path.join(teamDir, params.storedName);
  await writeFile(absPath, params.data);
  return {
    absolutePath: absPath,
    relativePath: path.posix.join(params.teamId, params.storedName),
  };
}

export function getTeamFileAbsolutePath(relativePath: string): string {
  const normalized = relativePath.replace(/[\\/]+/g, path.sep);
  return path.join(STORAGE_ROOT, normalized);
}

export async function removeTeamFile(relativePath: string): Promise<void> {
  const absPath = getTeamFileAbsolutePath(relativePath);
  try {
    await unlink(absPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }
  }
}
