import { TeamFilesPageClient } from "@/components/dashboard/team-files-page-client";
import { getTeamFilesPageData } from "@/lib/server/dashboard-data";

type TeamFilesPageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamFilesPage({ params }: TeamFilesPageProps) {
  const { teamId } = await params;
  const data = await getTeamFilesPageData(teamId);

  return <TeamFilesPageClient {...data} />;
}
