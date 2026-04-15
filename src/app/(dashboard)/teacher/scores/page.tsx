import { TeacherScoresPageClient } from "@/components/dashboard/teacher-scores-page-client";
import { getTeacherScoresPageData } from "@/lib/server/dashboard-data";

export default async function TeacherScoresPage() {
  const { rows } = await getTeacherScoresPageData();

  return <TeacherScoresPageClient rows={rows} />;
}
