import { TeamBoardPageClient } from "@/components/dashboard/team-board-page-client";
import { getTeamBoardPageData } from "@/lib/server/dashboard-data";

type TeamBoardPageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamBoardPage({ params }: TeamBoardPageProps) {
  const { teamId } = await params;
  const data = await getTeamBoardPageData(teamId);

  return <TeamBoardPageClient {...data} />;
}
