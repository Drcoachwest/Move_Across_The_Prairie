import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SEASON_OPTIONS, isTestSeason } from "@/lib/fitnessgram/constants";

/**
 * GET /api/teacher/assessment
 * Returns FitnesGram tests scoped to the teacher.
 *
 * Modes:
 * - Secondary: periodId required
 * - Elementary: grade required, classroomTeacher optional
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const teacherSession = cookieStore.get("teacher_session")?.value;
    const adminSession = cookieStore.get("admin_session")?.value;

    if (!teacherSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (adminSession && !teacherSession) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherSession },
      select: { id: true, school: true, schoolLevel: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId")?.trim();
    const gradeParam = searchParams.get("grade");
    const classroomTeacher = searchParams.get("classroomTeacher") || "";
    const testYear = searchParams.get("testYear");
    const testSeason = searchParams.get("testSeason");
    const studentId = searchParams.get("studentId");

    if (testSeason && !isTestSeason(testSeason)) {
      return NextResponse.json(
        { error: `Test season must be ${SEASON_OPTIONS.map((o) => o.value).join(" or ")}` },
        { status: 400 }
      );
    }

    const isSecondary = teacher.schoolLevel === "SECONDARY";

    if (isSecondary && !periodId) {
      return NextResponse.json(
        { error: "periodId is required for secondary teacher assessment queries." },
        { status: 400 }
      );
    }

    const parsedGrade = gradeParam ? parseInt(gradeParam, 10) : NaN;
    const isValidGrade = Number.isInteger(parsedGrade) && parsedGrade >= 3 && parsedGrade <= 12;

    if (!isSecondary && !isValidGrade) {
      return NextResponse.json(
        { error: "grade must be an integer between 3 and 12 for elementary teacher assessment queries." },
        { status: 400 }
      );
    }

    let allowedStudentIds: string[] = [];

    if (isSecondary && periodId) {
      const period = await prisma.classPeriod.findFirst({
        where: { id: periodId, teacherId: teacher.id },
        select: { id: true, schoolYear: true },
      });

      if (!period) {
        return NextResponse.json({ error: "Period not found" }, { status: 404 });
      }

      const assignments = await prisma.studentClassPeriodAssignment.findMany({
        where: {
          classPeriodId: periodId,
          schoolYear: period.schoolYear,
          dropDate: null,
        },
        select: { studentId: true },
      });

      allowedStudentIds = assignments.map((a) => a.studentId);
    } else if (!isSecondary && gradeParam) {
      const grade = parseInt(gradeParam, 10);
      const students = await prisma.student.findMany({
        where: {
          currentSchool: teacher.school,
          currentGrade: grade,
          ...(classroomTeacher ? { classroomTeacher } : {}),
        },
        select: { id: true },
      });

      allowedStudentIds = students.map((s) => s.id);
    }

    if (studentId && !allowedStudentIds.includes(studentId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (allowedStudentIds.length === 0) {
      return NextResponse.json({ tests: [] });
    }

    const where: any = {
      studentId: studentId || { in: allowedStudentIds },
    };

    if (testYear) where.testYear = parseInt(testYear, 10);
    if (testSeason) where.testSeason = testSeason;

    const tests = await prisma.fitnesGramTest.findMany({
      where,
      include: {
        student: {
          select: {
            districtId: true,
            firstName: true,
            lastName: true,
            currentGrade: true,
            currentSchool: true,
            peTeacher: true,
            classroomTeacher: true,
          },
        },
      },
      orderBy: { testDate: "desc" },
    });

    return NextResponse.json({ tests });
  } catch (error: any) {
    console.error("Error fetching teacher assessments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tests" },
      { status: 500 }
    );
  }
}
