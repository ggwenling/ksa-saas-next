import { ProfilePageClient } from "@/components/dashboard/profile-page-client";
import { getProfilePageData } from "@/lib/server/dashboard-data";

export default async function ProfilePage() {
  const { profile } = await getProfilePageData();

  return <ProfilePageClient profile={profile} />;
}
