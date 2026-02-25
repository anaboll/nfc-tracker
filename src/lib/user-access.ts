import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface UserAccess {
  userId: string;
  role: string;
  isAdmin: boolean;
  /** For viewers: list of allowed clientIds. For admins: null (all access). */
  allowedClientIds: string[] | null;
}

/**
 * Get the current user's access scope.
 * Returns null if not authenticated.
 */
export async function getUserAccess(): Promise<UserAccess | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const role = session.user.role || "viewer";
  const isAdmin = role === "admin";

  if (isAdmin) {
    return { userId: session.user.id, role, isAdmin, allowedClientIds: null };
  }

  // Viewer — fetch assigned client IDs
  const assignments = await prisma.userClient.findMany({
    where: { userId: session.user.id },
    select: { clientId: true },
  });

  return {
    userId: session.user.id,
    role,
    isAdmin,
    allowedClientIds: assignments.map((a) => a.clientId),
  };
}

/**
 * Build a Prisma where-clause filter for clientId based on user access.
 * Returns {} for admins (no filter), or { clientId: { in: [...] } } for viewers.
 */
export function clientFilter(access: UserAccess): Record<string, unknown> {
  if (access.isAdmin || !access.allowedClientIds) return {};
  return { clientId: { in: access.allowedClientIds } };
}
