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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionInfo();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (!session.isAdmin && lesson.createdByEmail !== session.email) {
      return NextResponse.json(
        { error: "Forbidden. You can only copy your own lessons." },
        { status: 403 }
      );
    }

    const createData: any = {
      title: `Copy of ${lesson.title}`,
      band: lesson.band,
      gradeGroup: lesson.gradeGroup,
      unit: lesson.unit,
      durationMinutes: lesson.durationMinutes,
      objectives: lesson.objectives,
      standards: lesson.standards,
      equipment: lesson.equipment,
      warmUp: lesson.warmUp,
      mainActivity: lesson.mainActivity,
      modifications: lesson.modifications,
      assessment: lesson.assessment,
      closure: lesson.closure,
      notes: lesson.notes,
      createdByEmail: session.email,
    };

    if ("resourceIds" in lesson) {
      createData.resourceIds = (lesson as { resourceIds?: string | null }).resourceIds ?? null;
    }

    const newLesson = await prisma.lesson.create({
      data: createData,
    });

    return NextResponse.json({ lessonId: newLesson.id });
  } catch (error) {
    console.error("Error copying lesson:", error);
    return NextResponse.json(
      { error: "Failed to copy lesson" },
      { status: 500 }
    );
  }
}
