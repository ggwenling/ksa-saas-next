export type TeamCard = {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  memberCount: number;
  inviteCode: string | null;
};

type TeamListResponse = {
  data?: TeamCard[];
  message?: string;
};

export type FilesEntryPageState =
  | {
      status: "ready";
      rows: TeamCard[];
    }
  | {
      status: "error";
      message: string;
    };

export async function loadFilesEntryPageData(
  fetcher: () => Promise<Response>,
): Promise<FilesEntryPageState> {
  try {
    const res = await fetcher();
    const json = (await res.json()) as TeamListResponse;

    if (!res.ok) {
      return {
        status: "error",
        message: json.message ?? "获取团队列表失败",
      };
    }

    return {
      status: "ready",
      rows: json.data ?? [],
    };
  } catch {
    return {
      status: "error",
      message: "网络异常，请稍后重试",
    };
  }
}
