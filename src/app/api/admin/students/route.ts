import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

/**
 * GET /api/admin/students
 * Get all students - filters by teacher's school if teacher is logged in
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
