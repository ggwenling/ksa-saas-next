type TaskStatusLike = "TODO" | "IN_PROGRESS" | "DONE";

export function calculateTeamProgress(tasks: { status: TaskStatusLike }[]): number {
  if (tasks.length === 0) {
    return 0;
  }
  const doneCount = tasks.filter((task) => task.status === "DONE").length;
  return Math.round((doneCount / tasks.length) * 100);
}
