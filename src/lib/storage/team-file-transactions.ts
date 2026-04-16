import {
  prepareTeamFileRemoval,
  removeTeamFile,
  saveTeamFile,
} from "./team-files";

type SavedTeamFile = Awaited<ReturnType<typeof saveTeamFile>>;

export async function saveTeamFileWithCompensation<T>(params: {
  teamId: string;
  storedName: string;
  data: Buffer;
  createRecord: (pathInfo: SavedTeamFile) => Promise<T>;
}): Promise<T> {
  const pathInfo = await saveTeamFile({
    teamId: params.teamId,
    storedName: params.storedName,
    data: params.data,
  });

  try {
    return await params.createRecord(pathInfo);
  } catch (error) {
    try {
      await removeTeamFile(pathInfo.relativePath);
    } catch {
      // Best-effort cleanup so a DB failure is less likely to leave an orphaned file behind.
    }
    throw error;
  }
}

export async function deleteTeamFileWithCompensation(params: {
  relativePath: string;
  deleteRecord: () => Promise<void>;
}): Promise<void> {
  const preparedRemoval = await prepareTeamFileRemoval(params.relativePath);

  try {
    await params.deleteRecord();
  } catch (error) {
    if (preparedRemoval) {
      await preparedRemoval.restore();
    }
    throw error;
  }

  if (preparedRemoval) {
    await preparedRemoval.commit();
  }
}
