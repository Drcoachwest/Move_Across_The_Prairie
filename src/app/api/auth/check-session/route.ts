import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/check-session
 * Validate teacher session and return teacher info
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const teacherSession = cookieStore.get("teacher_session")?.value;

    if (!teacherSession) {
      // Check for temp email during profile setup
      const tempEmail = cookieStore.get("temp_teacher_email")?.value;
      if (tempEmail) {
        return NextResponse.json({
          success: true,
          inSetup: true,
          email: tempEmail,
        });
      }

      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get teacher from database
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherSession },
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        school: teacher.school,
      },
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check session" },
      { status: 500 }
    );
  }
}
