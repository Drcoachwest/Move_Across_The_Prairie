import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    console.log("[GET /api/admin/logs] Admin session:", adminSession ? "present" : "missing");

    if (!adminSession) {
      console.log("[GET /api/admin/logs] Unauthorized - no admin session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "20", 10), 1),
      100
    );
    const action = searchParams.get("action")?.trim();
    const adminEmail = searchParams.get("adminEmail")?.trim();
    const search = searchParams.get("search")?.trim();
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();

    const where: any = {};
    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }
    if (adminEmail) {
      where.adminEmail = { contains: adminEmail, mode: "insensitive" };
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { adminEmail: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.adminLog.count({ where }),
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    console.log(`[GET /api/admin/logs] Found ${total} total logs, returning ${logs.length} for page ${page}`);
    console.log("[GET /api/admin/logs] Filters:", { action, adminEmail, search, from, to });

    return NextResponse.json({
      total,
      page,
      pageSize,
      logs: logs.map((log) => {
        let parsedDetails: unknown = null;
        try {
          parsedDetails = JSON.parse(log.details);
        } catch {
          parsedDetails = log.details;
        }

        return {
          ...log,
          createdAt: log.createdAt.toISOString(),
          details: parsedDetails,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
