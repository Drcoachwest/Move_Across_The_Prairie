import { NextRequest, NextResponse } from "next/server";
import { getLessonPlanById, deleteLessonPlan, updateLessonPlan } from "@/lib/lesson-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    // console.log("Fetching lesson plan with ID:", id);
    
    // Search for lesson plan in store
    const lessonPlan = getLessonPlanById(id);
    // console.log("Found lesson plan:", lessonPlan ? "yes" : "no");

    if (!lessonPlan) {
      return NextResponse.json(
        { success: false, message: "Lesson plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lessonPlan,
    });
  } catch (error) {
    console.error("Error fetching lesson plan:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();

    // Check if lesson plan exists
    const lessonPlan = getLessonPlanById(id);
    if (!lessonPlan) {
      return NextResponse.json(
        { success: false, message: "Lesson plan not found" },
        { status: 404 }
      );
    }

    // Update the lesson plan
    const updated = updateLessonPlan(id, data);

    if (updated) {
      const updatedLessonPlan = getLessonPlanById(id);
      return NextResponse.json({
        success: true,
        message: "Lesson plan updated successfully",
        lessonPlan: updatedLessonPlan,
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to update lesson plan" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating lesson plan:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if lesson plan exists
    const lessonPlan = getLessonPlanById(id);
    if (!lessonPlan) {
      return NextResponse.json(
        { success: false, message: "Lesson plan not found" },
        { status: 404 }
      );
    }

    // Delete the lesson plan
    const deleted = deleteLessonPlan(id);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: "Lesson plan deleted successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to delete lesson plan" },
        { status: 500 }
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
