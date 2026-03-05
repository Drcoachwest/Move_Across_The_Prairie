import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-logs";
import { cookies } from "next/headers";

/**
 * GET /api/admin/teachers
 * Get all teachers for admin management
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const teachers = await prisma.teacher.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } },
              { school: { contains: search } },
            ],
          }
        : {},
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
        activated: true,
        activatedAt: true,
        createdAt: true,
        locked: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      teachers: teachers.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        activatedAt: t.activatedAt ? t.activatedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    if (!adminSession) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, action } = body;

    if (!email || !action) {
      return NextResponse.json({ success: false, message: "Missing email or action" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher) {
      return NextResponse.json({ success: false, message: "Teacher not found" }, { status: 404 });
    }

    switch (action) {
      case "activate":
        await prisma.teacher.update({
          where: { email },
          data: {
            activated: true,
            activatedAt: new Date(),
          },
        });
        await logAdminAction("teacher_activate", {
          email,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          userAgent: request.headers.get("user-agent") || null,
        });
        break;

      case "deactivate":
        await prisma.teacher.update({
          where: { email },
          data: { activated: false },
        });
        await logAdminAction("teacher_deactivate", {
          email,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          userAgent: request.headers.get("user-agent") || null,
        });
        break;

      case "lock":
        await prisma.teacher.update({
          where: { email },
          data: { locked: true },
        });
        await logAdminAction("teacher_lock", {
          email,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          userAgent: request.headers.get("user-agent") || null,
        });
        break;

      case "unlock":
        await prisma.teacher.update({
          where: { email },
          data: { locked: false },
        });
        await logAdminAction("teacher_unlock", {
          email,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          userAgent: request.headers.get("user-agent") || null,
        });
        break;

      case "resend-activation":
        // Email sending would be handled by a separate service
        await logAdminAction("teacher_resend_activation", {
          email,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          userAgent: request.headers.get("user-agent") || null,
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json({ success: false, message: "Failed to update teacher" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    if (!adminSession) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: "Missing email" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher) {
      return NextResponse.json({ success: false, message: "Teacher not found" }, { status: 404 });
    }

    await prisma.teacher.delete({ where: { email } });

    await logAdminAction("teacher_delete", {
      email,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ success: false, message: "Failed to delete teacher" }, { status: 500 });
  }
}
