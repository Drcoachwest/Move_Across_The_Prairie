import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// PUT - Update an existing curriculum resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Get existing resource
    const existingResource = await prisma.curriculumResource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Update database record
    const resource = await prisma.curriculumResource.update({
      where: { id },
      data: {
        title,
        description: description || null,
        band: band || "ELEMENTARY",
        gradeGroup: gradeGroup || null,
        unit: unit || null,
        subject: subject || null,
        tags: tags || null,
        type,
        externalUrl: type === "link" ? externalUrl : null,
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error("Error updating curriculum resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a curriculum resource
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete the resource
    await prisma.curriculumResource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting curriculum resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
