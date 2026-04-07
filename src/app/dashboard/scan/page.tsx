import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardScanClient from "./dashboard-scan-client";

export default async function DashboardScanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "free";

  return (
    <DashboardScanClient
      userName={session.user.name?.split(" ")[0] ?? ""}
      plan={plan}
    />
  );
}
