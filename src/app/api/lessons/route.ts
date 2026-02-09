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

// GET - Fetch lessons for the logged-in user (or all if admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionInfo();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to access lessons." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const band = searchParams.get("band")?.trim();
    const gradeGroup = searchParams.get("gradeGroup")?.trim();
    const unit = searchParams.get("unit")?.trim();
    const q = searchParams.get("q")?.trim();

    const where: any = {};
    
    // Teachers can only see their own lessons, admins can see all
    if (!session.isAdmin) {
      where.createdByEmail = session.email;
    }

    if (band) where.band = band;
    if (gradeGroup) where.gradeGroup = gradeGroup;
    if (unit) where.unit = unit;
    
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { objectives: { contains: q, mode: "insensitive" } },
        { unit: { contains: q, mode: "insensitive" } },
      ];
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

// POST - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionInfo();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create lessons." },
        { status: 401 }
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
    if (!title || title.length === 0) {
      return NextResponse.json(
        { error: "Title is required and cannot be empty", field: "title" },
        { status: 400 }
      );
    }

    if (!unit || unit.length === 0) {
      return NextResponse.json(
        { error: "Unit is required and cannot be empty", field: "unit" },
        { status: 400 }
      );
    }

    // Validate band
    const validBands = ["ELEMENTARY", "MIDDLE", "HIGH"];
    if (!band || !validBands.includes(band)) {
      return NextResponse.json(
        { error: `Band must be one of: ${validBands.join(", ")}`, field: "band" },
        { status: 400 }
      );
    }

    // Validate gradeGroup
    const validGradeGroups = ["K-2", "3-5", "6-8", "9-12"];
    if (!gradeGroup || !validGradeGroups.includes(gradeGroup)) {
      return NextResponse.json(
        { error: `Grade group must be one of: ${validGradeGroups.join(", ")}`, field: "gradeGroup" },
        { status: 400 }
      );
    }

    // Validate durationMinutes
    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration < 10 || duration > 180) {
      return NextResponse.json(
        { error: "Duration must be a number between 10 and 180 minutes", field: "durationMinutes" },
        { status: 400 }
      );
    }

    // Validate required text fields
    if (!objectives || objectives.length === 0) {
      return NextResponse.json(
        { error: "Objectives are required", field: "objectives" },
        { status: 400 }
      );
    }

    if (!warmUp || warmUp.length === 0) {
      return NextResponse.json(
        { error: "Warm up is required", field: "warmUp" },
        { status: 400 }
      );
    }

    if (!mainActivity || mainActivity.length === 0) {
      return NextResponse.json(
        { error: "Main activity is required", field: "mainActivity" },
        { status: 400 }
      );
    }

    if (!assessment || assessment.length === 0) {
      return NextResponse.json(
        { error: "Assessment is required", field: "assessment" },
        { status: 400 }
      );
    }

    if (!closure || closure.length === 0) {
      return NextResponse.json(
        { error: "Closure is required", field: "closure" },
        { status: 400 }
      );
    }

    // Create lesson with the session user's email
    const lesson = await prisma.lesson.create({
      data: {
        title,
        band,
        gradeGroup,
        unit,
        durationMinutes: duration,
        objectives,
        standards: standards || null,
        equipment: equipment || null,
        warmUp,
        mainActivity,
        modifications: modifications || null,
        assessment,
        closure,
        notes: notes || null,
        resourceIds: resourceIds && Array.isArray(resourceIds) ? resourceIds.join(',') : null,
        createdByEmail: session.email,
      },
    });

    return NextResponse.json({ success: true, lesson }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
