import { prisma } from "@/lib/db";
import { getAdminCredentials } from "@/lib/admin-auth";

export type AdminLogDetails = Record<string, unknown>;

export async function logAdminAction(
  action: string,
  details: AdminLogDetails = {},
  adminEmail?: string
) {
  try {
    const { username } = getAdminCredentials();
    await prisma.adminLog.create({
      data: {
        action,
        adminEmail: adminEmail || username,
        details: JSON.stringify(details ?? {}),
      },
    });
  } catch (error) {
    console.error("[logAdminAction] Failed to log admin action:", action, error);
  }
}
