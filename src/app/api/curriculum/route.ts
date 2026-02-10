import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-logs";
import { cookies } from "next/headers";

// GET - Fetch all curriculum resources
export async function GET(request: NextRequest) {
  try {
    // Check for authenticated session (teacher or admin)
    const cookieStore = await cookies();
    const teacherSession = cookieStore.get("teacher_session");
    const adminSession = cookieStore.get("admin_session");
    
    // DEBUG: Log which session type is being used
    const sessionType = adminSession ? "admin" : teacherSession ? "teacher" : "none";
    console.log(`[GET /api/curriculum] Session type: ${sessionType}`);
    
    if (!teacherSession && !adminSession) {
      console.log("[GET /api/curriculum] Access denied - no session found");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to access curriculum resources." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const band = searchParams.get("band")?.trim();
    const gradeGroup = searchParams.get("gradeGroup")?.trim();
    const unit = searchParams.get("unit")?.trim();
    const q = searchParams.get("q")?.trim();

    const where: {
      band?: string;
      gradeGroup?: string;
      unit?: string;
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
        unit?: { contains: string; mode: "insensitive" };
        tags?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (band) where.band = band;
    if (gradeGroup) where.gradeGroup = gradeGroup;
    if (unit) where.unit = unit;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { unit: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ];
    }

    const resources = await prisma.curriculumResource.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    });

    console.log(`[GET /api/curriculum] Returning ${resources.length} resources to ${sessionType} user`);
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching curriculum resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST - Upload a new curriculum resource
export async function POST(request: NextRequest) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { title, description, band, gradeGroup, unit, subject, tags, type, externalUrl } = body;

    // Trim all string inputs
    title = title?.trim();
    description = description?.trim();
    band = band?.trim();
    gradeGroup = gradeGroup?.trim();
    unit = unit?.trim();
    subject = subject?.trim();
    tags = tags?.trim();
    type = type?.trim();
    externalUrl = externalUrl?.trim();

    // Validate required fields
    if (!title || title.length === 0) {
      return NextResponse.json(
        { error: "Title is required and cannot be empty", field: "title" },
        { status: 400 }
      );
    }

    if (!type || type.length === 0) {
      return NextResponse.json(
        { error: "Type is required and cannot be empty", field: "type" },
        { status: 400 }
      );
    }

    // Validate band
    const validBands = ["ELEMENTARY", "MIDDLE", "HIGH"];
    if (band && !validBands.includes(band)) {
      return NextResponse.json(
        { error: `Band must be one of: ${validBands.join(", ")}`, field: "band" },
        { status: 400 }
      );
    }

    // Validate gradeGroup
    const validGradeGroups = ["K-2", "3-5", "6-8", "9-12"];
    if (gradeGroup && !validGradeGroups.includes(gradeGroup)) {
      return NextResponse.json(
        { error: `Grade group must be one of: ${validGradeGroups.join(", ")}`, field: "gradeGroup" },
        { status: 400 }
      );
    }

    // Validate external URL if provided
    if (type === "link" && externalUrl) {
      if (externalUrl.length === 0) {
        return NextResponse.json(
          { error: "URL cannot be empty for link type", field: "externalUrl" },
          { status: 400 }
        );
      }
      try {
        new URL(externalUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format", field: "externalUrl" },
          { status: 400 }
        );
      }
    }

    // Create database record
    const resource = await prisma.curriculumResource.create({
      data: {
        title,
        description: description || null,
        band: band || "ELEMENTARY",
        gradeGroup: gradeGroup || null,
        unit: unit || null,
        subject: subject || null,
        tags: tags || null,
        type,
        fileUrl: null,
        externalUrl: type === "link" ? externalUrl : null,
        createdBy: "admin",
      },
    });

    await logAdminAction("curriculum_resource_create", {
      title,
      band: band || "ELEMENTARY",
      gradeGroup: gradeGroup || null,
      unit: unit || null,
      subject: subject || null,
      type,
      externalUrl: type === "link" ? externalUrl : null,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent") || null,
      resourceId: resource.id,
    });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error) {
    console.error("Error uploading curriculum resource:", error);
    return NextResponse.json(
      { error: "Failed to upload resource" },
      { status: 500 }
    );
  }
}
