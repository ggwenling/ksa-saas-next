import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireDashboardUser } from "@/lib/server/dashboard-data";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDashboardUser();

  return <DashboardShell>{children}</DashboardShell>;
}
