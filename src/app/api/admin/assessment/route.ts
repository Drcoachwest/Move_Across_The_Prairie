import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

/**
 * POST /api/admin/assessment
 * Create or update FitnesGram test data
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      studentId,
      testDate,
      testSeason,
      testYear,
      cardioTestType,
      pacerOrMileRun,
      pushups,
      situps,
      sitAndReach,
      shoulderStretchRight,
      shoulderStretchLeft,
      height,
      weight,
      bmi,
      trunkLift,
      notes,
    } = body;

    if (!studentId || !testDate || !testSeason || !testYear) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, testDate, testSeason, testYear" },
        { status: 400 }
      );
    }

    // Get student to ensure it exists and get school
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if test already exists for this student, year, and season
    const existingTest = await prisma.fitnesGramTest.findUnique({
      where: {
        studentId_testYear_testSeason: {
          studentId,
          testYear,
          testSeason: testSeason as "Fall" | "Spring",
        },
      },
    });

    let test;
    if (existingTest) {
      // Update existing test
      test = await prisma.fitnesGramTest.update({
        where: { id: existingTest.id },
        data: {
          testDate: new Date(testDate),
          cardioTestType: cardioTestType || "PACER",
          pacerOrMileRun: pacerOrMileRun || null,
          pushups: pushups || null,
          situps: situps || null,
          sitAndReach: sitAndReach || null,
          shoulderStretchRight: shoulderStretchRight || null,
          shoulderStretchLeft: shoulderStretchLeft || null,
          height: height || null,
          weight: weight || null,
          bmi: bmi || null,
          trunkLift: trunkLift || null,
          notes: notes || null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new test
      test = await prisma.fitnesGramTest.create({
        data: {
          studentId,
          school: student.currentSchool,
          testDate: new Date(testDate),
          testSeason: testSeason as "Fall" | "Spring",
          testYear,
          cardioTestType: cardioTestType || "PACER",
          pacerOrMileRun: pacerOrMileRun || null,
          pushups: pushups || null,
          situps: situps || null,
          sitAndReach: sitAndReach || null,
          shoulderStretchRight: shoulderStretchRight || null,
          shoulderStretchLeft: shoulderStretchLeft || null,
          height: height || null,
          weight: weight || null,
          bmi: bmi || null,
          trunkLift: trunkLift || null,
          notes: notes || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingTest ? "Test updated successfully" : "Test created successfully",
      test,
    });
  } catch (error: any) {
    console.error("Error saving assessment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save test" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/assessment
 * Get FitnesGram tests with optional filtering
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const testYear = searchParams.get("testYear");
    const testSeason = searchParams.get("testSeason");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (testYear) where.testYear = parseInt(testYear);
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
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tests" },
      { status: 500 }
    );
  }
}
