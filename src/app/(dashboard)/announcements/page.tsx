import { AnnouncementsPageClient } from "@/components/dashboard/announcements-page-client";
import { getAnnouncementsPageData } from "@/lib/server/dashboard-data";

export default async function AnnouncementsPage() {
  const data = await getAnnouncementsPageData();

  return <AnnouncementsPageClient {...data} />;
}
