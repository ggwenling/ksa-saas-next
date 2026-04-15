import { TeamsPageClient } from "@/components/dashboard/teams-page-client";
import { getTeamsPageData } from "@/lib/server/dashboard-data";

export default async function TeamsPage() {
  const { teams } = await getTeamsPageData();

  return <TeamsPageClient teams={teams} />;
}
