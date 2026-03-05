import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import {
  CARDIO_TEST_OPTIONS,
  CARDIO_TEST_TYPE,
  SEASON_OPTIONS,
  isCardioTestType,
  isTestSeason,
} from "@/lib/fitnessgram/constants";
import { calculateBMI_US } from "@/lib/fitnessgram/bmi";

type AssessmentInput = {
  studentId: string;
  testDate: string;
  testSeason: string;
  testYear: number;
  cardioTestType?: string;
  pacerOrMileRun?: number | null;
  pushups?: number | null;
  situps?: number | null;
  sitAndReach?: number | null;
  shoulderStretchRight?: boolean | null;
  shoulderStretchLeft?: boolean | null;
  height?: number | null;
  weight?: number | null;
  trunkLift?: number | null;
  notes?: string | null;
};

export async function POST(request: NextRequest) {
  try {
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
    const items: AssessmentInput[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No assessment items provided" },
        { status: 400 }
      );
    }

    const results: Array<{ studentId: string; success: boolean; error?: string }> = [];

    for (const item of items) {
      try {
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
          trunkLift,
          notes,
        } = item;

        if (!studentId || !testDate || !testSeason || !testYear) {
          throw new Error("Missing required fields: studentId, testDate, testSeason, testYear");
        }

        if (!isTestSeason(String(testSeason))) {
          throw new Error(`Test season must be ${SEASON_OPTIONS.map((o) => o.value).join(" or ")}`);
        }

        if (cardioTestType && !isCardioTestType(String(cardioTestType))) {
          throw new Error(`Cardio test type must be ${CARDIO_TEST_OPTIONS.map((o) => o.value).join(" or ")}`);
        }

        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          throw new Error("Student not found");
        }

        const existingTest = await prisma.fitnesGramTest.findUnique({
          where: {
            studentId_testYear_testSeason: {
              studentId,
              testYear,
              testSeason,
            },
          },
        });

        const computedBMI = calculateBMI_US(height ?? null, weight ?? null);

        if (existingTest) {
          await prisma.fitnesGramTest.update({
            where: { id: existingTest.id },
            data: {
              testDate: new Date(testDate),
              cardioTestType: (cardioTestType as string) || CARDIO_TEST_TYPE.PACER,
              pacerOrMileRun: pacerOrMileRun ?? null,
              pushups: pushups ?? null,
              situps: situps ?? null,
              sitAndReach: sitAndReach ?? null,
              shoulderStretchRight: shoulderStretchRight ?? null,
              shoulderStretchLeft: shoulderStretchLeft ?? null,
              height: height ?? null,
              weight: weight ?? null,
              bmi: computedBMI,
              trunkLift: trunkLift ?? null,
              notes: notes ?? null,
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.fitnesGramTest.create({
            data: {
              studentId,
              school: student.currentSchool,
              testDate: new Date(testDate),
              testSeason,
              testYear,
              cardioTestType: (cardioTestType as string) || CARDIO_TEST_TYPE.PACER,
              pacerOrMileRun: pacerOrMileRun ?? null,
              pushups: pushups ?? null,
              situps: situps ?? null,
              sitAndReach: sitAndReach ?? null,
              shoulderStretchRight: shoulderStretchRight ?? null,
              shoulderStretchLeft: shoulderStretchLeft ?? null,
              height: height ?? null,
              weight: weight ?? null,
              bmi: computedBMI,
              trunkLift: trunkLift ?? null,
              notes: notes ?? null,
            },
          });
        }

        results.push({ studentId, success: true });
      } catch (error: any) {
        results.push({
          studentId: item.studentId || "unknown",
          success: false,
          error: error.message || "Failed to save",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error saving bulk assessments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save assessments" },
      { status: 500 }
    );
  }
}
