import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SettingsPage from "@/components/settings/SettingsPage";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <SettingsPage session={session} />;
}
