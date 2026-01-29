import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getLessonPlans, addLessonPlan, deleteLessonPlan } from "@/lib/lesson-store";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      lessonPlans: getLessonPlans(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      title,
      teacher,
      campus,
      gradeLevel,
      date,
      safetyAndManagement,
      instantActivityWarmUp,
      skillIntroduction,
      skillPractice,
      applicationActivity,
      coolDownClosure,
      assessment,
      mvpa,
      adaptations,
      teacherReflections,
      isDraft,
      selectedResources,
    } = data;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Teacher name is required" },
        { status: 400 }
      );
    }

    if (!campus) {
      return NextResponse.json(
        { success: false, message: "Campus is required" },
        { status: 400 }
      );
    }

    if (!gradeLevel) {
      return NextResponse.json(
        { success: false, message: "Grade level is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required" },
        { status: 400 }
      );
    }

    // Create and save lesson plan
    const newLessonPlan = {
      id: crypto.randomUUID(),
      title,
      teacher,
      campus,
      gradeLevel,
      date,
      safetyAndManagement,
      instantActivityWarmUp,
      skillIntroduction,
      skillPractice,
      applicationActivity,
      coolDownClosure,
      assessment,
      mvpa,
      adaptations,
      teacherReflections,
      isDraft,
      createdAt: new Date(),
      updatedAt: new Date(),
      resources: selectedResources,
    };

    // Save to shared store
    addLessonPlan(newLessonPlan);

    return NextResponse.json({
      success: true,
      message: "Lesson plan saved successfully",
      lessonPlan: newLessonPlan,
    });
  } catch (error) {
    console.error("Error creating lesson plan:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Lesson plan ID is required" },
        { status: 400 }
      );
    }

    const success = deleteLessonPlan(id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Lesson plan deleted successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Lesson plan not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting lesson plan:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
