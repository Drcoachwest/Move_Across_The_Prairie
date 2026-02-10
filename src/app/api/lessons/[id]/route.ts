import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// Helper to get session email and role
async function getSessionInfo() {
  const cookieStore = await cookies();
  const teacherSession = cookieStore.get("teacher_session");
  const teacherInfo = cookieStore.get("teacher_info");
  const adminSession = cookieStore.get("admin_session");
  
  if (teacherSession && teacherInfo) {
    try {
      const sessionData = JSON.parse(teacherInfo.value);
      return { email: sessionData.email, isAdmin: false };
    } catch {
      // If parsing fails, fetch teacher from database
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherSession.value },
      });
      if (teacher) {
        return { email: teacher.email, isAdmin: false };
      }
    }
  }
  
  if (adminSession) {
    return { email: "admin", isAdmin: true };
  }
  
  return null;
}

// GET - Fetch a single lesson by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionInfo();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Teachers can only access their own lessons, admins can access any
    if (!session.isAdmin && lesson.createdByEmail !== session.email) {
      return NextResponse.json(
        { error: "Forbidden. You can only access your own lessons." },
        { status: 403 }
      );
    }

    // Populate attached resources if resourceIds exist
    let resources = [];
    if (lesson.resourceIds) {
      const resourceIdArray = lesson.resourceIds.split(',').filter(Boolean);
      if (resourceIdArray.length > 0) {
        const curriculumResources = await prisma.curriculumResource.findMany({
          where: {
            id: { in: resourceIdArray },
          },
          select: {
            id: true,
            title: true,
            unit: true,
            type: true,
            fileUrl: true,
            externalUrl: true,
          },
        });
        resources = curriculumResources;
      }
    }

    return NextResponse.json({ lesson, resources });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

// PUT - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionInfo();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Teachers can only update their own lessons, admins can update any
    if (!session.isAdmin && existingLesson.createdByEmail !== session.email) {
      return NextResponse.json(
        { error: "Forbidden. You can only update your own lessons." },
        { status: 403 }
      );
    }

    const body = await request.json();
    let {
      title,
      band,
      gradeGroup,
      unit,
      durationMinutes,
      objectives,
      standards,
      equipment,
      warmUp,
      mainActivity,
      modifications,
      assessment,
      closure,
      notes,
      resourceIds,
    } = body;

    // Trim all string inputs
    title = title?.trim();
    band = band?.trim();
    gradeGroup = gradeGroup?.trim();
    unit = unit?.trim();
    objectives = objectives?.trim();
    standards = standards?.trim();
    equipment = equipment?.trim();
    warmUp = warmUp?.trim();
    mainActivity = mainActivity?.trim();
    modifications = modifications?.trim();
    assessment = assessment?.trim();
    closure = closure?.trim();
    notes = notes?.trim();

    // Validate required fields
    if (title !== undefined && (!title || title.length === 0)) {
      return NextResponse.json(
        { error: "Title cannot be empty", field: "title" },
        { status: 400 }
      );
    }

    if (unit !== undefined && (!unit || unit.length === 0)) {
      return NextResponse.json(
        { error: "Unit cannot be empty", field: "unit" },
        { status: 400 }
      );
    }

    // Validate band if provided
    if (band !== undefined) {
      const validBands = ["ELEMENTARY", "MIDDLE", "HIGH"];
      if (!validBands.includes(band)) {
        return NextResponse.json(
          { error: `Band must be one of: ${validBands.join(", ")}`, field: "band" },
          { status: 400 }
        );
      }
    }

    // Validate gradeGroup if provided
    if (gradeGroup !== undefined) {
      const validGradeGroups = ["K-2", "3-5", "6-8", "9-12"];
      if (!validGradeGroups.includes(gradeGroup)) {
        return NextResponse.json(
          { error: `Grade group must be one of: ${validGradeGroups.join(", ")}`, field: "gradeGroup" },
          { status: 400 }
        );
      }
    }

    // Validate durationMinutes if provided
    if (durationMinutes !== undefined) {
      const duration = parseInt(durationMinutes, 10);
      if (isNaN(duration) || duration < 10 || duration > 180) {
        return NextResponse.json(
          { error: "Duration must be a number between 10 and 180 minutes", field: "durationMinutes" },
          { status: 400 }
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (band !== undefined) updateData.band = band;
    if (gradeGroup !== undefined) updateData.gradeGroup = gradeGroup;
    if (unit !== undefined) updateData.unit = unit;
    if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes, 10);
    if (objectives !== undefined) updateData.objectives = objectives;
    if (standards !== undefined) updateData.standards = standards || null;
    if (equipment !== undefined) updateData.equipment = equipment || null;
    if (warmUp !== undefined) updateData.warmUp = warmUp;
    if (mainActivity !== undefined) updateData.mainActivity = mainActivity;
    if (modifications !== undefined) updateData.modifications = modifications || null;
    if (assessment !== undefined) updateData.assessment = assessment;
    if (closure !== undefined) updateData.closure = closure;
    if (notes !== undefined) updateData.notes = notes || null;
    if (resourceIds !== undefined) updateData.resourceIds = resourceIds && Array.isArray(resourceIds) ? resourceIds.join(',') : null;

    // Update lesson
    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lesson
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionInfo();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Teachers can only delete their own lessons, admins can delete any
    if (!session.isAdmin && lesson.createdByEmail !== session.email) {
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own lessons." },
        { status: 403 }
      );
    }

    // Delete lesson
    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
