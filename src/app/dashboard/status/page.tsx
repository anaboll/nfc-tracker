import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StatusPage from "@/components/dashboard/StatusPage";

/**
 * Admin-only server status dashboard.
 *
 * Shows live health of both app replicas + host info. Accessed via the gear
 * menu or direct URL. Mobile-friendly so the admin can check from a phone
 * during / after a rolling deploy.
 */
export const dynamic = "force-dynamic";

export default async function Status() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");
  return <StatusPage />;
}
