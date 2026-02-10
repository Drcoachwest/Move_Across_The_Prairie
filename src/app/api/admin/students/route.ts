import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-logs";
import { cookies } from "next/headers";

/**
 * GET /api/admin/students
 * Get all students - filters by teacher's school if teacher is logged in
 * Also handles getting teachers for admin user management
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (admin or teacher)
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const teacherSession = cookieStore.get("teacher_session")?.value;
    
    if (!adminSession && !teacherSession) {
      return NextResponse.json(
        { error: "Unauthorized - login required" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const school = searchParams.get("school");
    const grade = searchParams.get("grade");
    const peTeacher = searchParams.get("peTeacher");
    const search = searchParams.get("search") || "";

    // If admin is logged in, return teachers list by default
    if (adminSession) {
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
    }

    // Otherwise return students (existing behavior)
    const where: any = {};
    
    // If teacher is logged in (not admin), automatically filter by their school only
    if (teacherSession && !adminSession) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherSession },
        select: { school: true },
      });
      
      if (teacher) {
        where.currentSchool = teacher.school;
      }
    }
    
    // Override with explicit query parameters if provided
    if (school) where.currentSchool = school;
    if (grade) where.currentGrade = parseInt(grade);
    if (peTeacher) where.peTeacher = peTeacher;

    const students = await prisma.student.findMany({
      where,
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        districtId: true,
        firstName: true,
        lastName: true,
        sex: true,
        dateOfBirth: true,
        currentGrade: true,
        currentSchool: true,
        peTeacher: true,
        classroomTeacher: true,
      },
    });

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch students" },
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
